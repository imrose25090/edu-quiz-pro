import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, doc, updateDoc, getDoc, setDoc,
  where, getDocs, Timestamp
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════

interface ChatUser {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: any;
  type: 'text' | 'call_started' | 'call_ended';
}

interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageAt: any;
  unreadCount?: number;
}

interface ChatPanelProps {
  currentUser: ChatUser;
  allUsers: ChatUser[]; // সব teachers + students + admin
  onClose: () => void;
}

// ═══════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════

const getConversationId = (uid1: string, uid2: string) =>
  [uid1, uid2].sort().join('__');

const roleColor = (role: string) => {
  if (role === 'admin')   return 'bg-rose-100 text-rose-600';
  if (role === 'teacher') return 'bg-indigo-100 text-indigo-600';
  return 'bg-emerald-100 text-emerald-600';
};

const roleLabel = (role: string) => {
  if (role === 'admin')   return 'অ্যাডমিন';
  if (role === 'teacher') return 'শিক্ষক';
  return 'ছাত্র';
};

const formatTime = (ts: any) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'এইমাত্র';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} মিনিট আগে`;
  if (diff < 86400000) return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('bn-BD');
};

// ═══════════════════════════════════════════════════
// WEBRTC CALL MODAL
// ═══════════════════════════════════════════════════

interface CallModalProps {
  type: 'voice' | 'video';
  callerName: string;
  calleeName: string;
  isCaller: boolean;
  conversationId: string;
  onEnd: () => void;
}

const CallModal: React.FC<CallModalProps> = ({
  type, callerName, calleeName, isCaller, conversationId, onEnd
}) => {
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>(
    isCaller ? 'calling' : 'connected'
  );
  const [isMuted,    setIsMuted]    = useState(false);
  const [isCamOff,   setIsCamOff]   = useState(false);
  const [callTime,   setCallTime]   = useState(0);

  // Call timer
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const t = setInterval(() => setCallTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  const formatCallTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // WebRTC setup
  useEffect(() => {
    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
          setCallStatus('connected');
        };

        const sigRef = doc(db, 'calls', conversationId);

        pc.onicecandidate = async (e) => {
          if (e.candidate) {
            const field = isCaller ? 'callerCandidates' : 'calleeCandidates';
            const snap = await getDoc(sigRef);
            const existing = snap.data()?.[field] || [];
            await setDoc(sigRef, { [field]: [...existing, e.candidate.toJSON()] }, { merge: true });
          }
        };

        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await setDoc(sigRef, { offer: { type: offer.type, sdp: offer.sdp }, status: 'calling' }, { merge: true });

          // Listen for answer
          onSnapshot(sigRef, async (snap) => {
            const data = snap.data();
            if (data?.answer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
            if (data?.calleeCandidates) {
              for (const c of data.calleeCandidates) {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
              }
            }
            if (data?.status === 'ended') endCall();
          });
        } else {
          // Callee
          const snap = await getDoc(sigRef);
          const data = snap.data();
          if (data?.offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await setDoc(sigRef, { answer: { type: answer.type, sdp: answer.sdp }, status: 'connected' }, { merge: true });
          }

          onSnapshot(sigRef, async (snap) => {
            const d = snap.data();
            if (d?.callerCandidates) {
              for (const c of d.callerCandidates) {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
              }
            }
            if (d?.status === 'ended') endCall();
          });
        }
      } catch (err: any) {
        console.error('WebRTC error:', err);
        // Permission denied বা device না থাকলে gracefully বন্ধ করো
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('⚠️ Microphone/Camera permission দিন। Browser এর address bar এ 🔒 icon এ click করুন।');
        } else if (err.name === 'NotFoundError') {
          alert('⚠️ Microphone বা Camera পাওয়া যাচ্ছে না। Device connect করুন।');
        } else {
          alert('⚠️ Call করতে সমস্যা হয়েছে: ' + err.message);
        }
        onEnd();
      }
    };

    setup();
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
  }, []);

  const endCall = useCallback(async () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    try {
      await setDoc(doc(db, 'calls', conversationId), { status: 'ended' }, { merge: true });
    } catch {}
    setCallStatus('ended');
    setTimeout(onEnd, 1000);
  }, [conversationId, onEnd]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = isCamOff; });
      setIsCamOff(!isCamOff);
    }
  };

  const otherName = isCaller ? calleeName : callerName;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 flex flex-col items-center justify-between p-8 font-['Hind_Siliguri']">

      {/* Remote video (background) */}
      {type === 'video' && (
        <video ref={remoteVideoRef} autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80" />
      )}

      {/* Top info */}
      <div className="relative z-10 text-center mt-8">
        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-4 text-3xl font-black text-white shadow-2xl">
          {otherName[0]?.toUpperCase()}
        </div>
        <h2 className="text-white font-black text-2xl">{otherName}</h2>
        <p className="text-slate-300 text-sm mt-1">
          {callStatus === 'calling'   && (type === 'voice' ? '📞 কল করা হচ্ছে...' : '📹 ভিডিও কল করা হচ্ছে...')}
          {callStatus === 'connected' && `✅ সংযুক্ত — ${formatCallTime(callTime)}`}
          {callStatus === 'ended'     && '❌ কল শেষ'}
        </p>
      </div>

      {/* Local video (pip) */}
      {type === 'video' && (
        <video ref={localVideoRef} autoPlay playsInline muted
          className="absolute bottom-32 right-4 w-32 h-24 rounded-2xl object-cover border-2 border-white/30 shadow-xl z-10" />
      )}
      {type === 'voice' && <div ref={localVideoRef as any} />}

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-5 mb-8">
        <button onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-xl transition-all active:scale-90 ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
          {isMuted ? '🔇' : '🎤'}
        </button>

        {type === 'video' && (
          <button onClick={toggleCam}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-xl transition-all active:scale-90 ${isCamOff ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            {isCamOff ? '📵' : '📹'}
          </button>
        )}

        <button onClick={endCall}
          className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center text-2xl shadow-2xl hover:bg-rose-700 transition-all active:scale-90">
          📵
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MAIN CHAT PANEL
// ═══════════════════════════════════════════════════

export const ChatPanel: React.FC<ChatPanelProps> = ({ currentUser, allUsers, onClose }) => {
  const [conversations,    setConversations]    = useState<Conversation[]>([]);
  const [activeConvId,     setActiveConvId]     = useState<string | null>(null);
  const [activeOtherUser,  setActiveOtherUser]  = useState<ChatUser | null>(null);
  const [messages,         setMessages]         = useState<Message[]>([]);
  const [inputText,        setInputText]        = useState('');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [callModal,        setCallModal]        = useState<{ type: 'voice' | 'video'; isCaller: boolean } | null>(null);
  const [incomingCall,     setIncomingCall]     = useState<{ type: 'voice' | 'video'; callerName: string; convId: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // যেসব user এর সাথে chat করা যাবে
  const chatableUsers = allUsers.filter(u => {
    if (u.id === currentUser.id) return false;
    // Student → Teacher, Admin
    if (currentUser.role === 'student') return u.role === 'teacher' || u.role === 'admin';
    // Teacher → Student, Admin
    if (currentUser.role === 'teacher') return u.role === 'student' || u.role === 'admin';
    // Admin → সবাই
    if (currentUser.role === 'admin') return true;
    return false;
  });

  const filteredUsers = searchQuery
    ? chatableUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatableUsers;

  // Conversations load
  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.id)
    );
    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
      convs.sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis?.() || 0;
        const tb = b.lastMessageAt?.toMillis?.() || 0;
        return tb - ta;
      });
      setConversations(convs);
    });
    return () => unsub();
  }, [currentUser.id]);

  // Messages load
  useEffect(() => {
    if (!activeConvId) return;
    const q = query(
      collection(db, 'conversations', activeConvId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
    return () => unsub();
  }, [activeConvId]);

  // Incoming call listener
  const shownCallIds = React.useRef<Set<string>>(new Set());
  useEffect(() => {
    const callsRef = collection(db, 'calls');
    const unsub = onSnapshot(callsRef, snap => {
      snap.docChanges().forEach(change => {
        const data = change.doc.data();
        const callId = change.doc.id;
        if (
          data.calleeId === currentUser.id &&
          data.status === 'calling' &&
          !shownCallIds.current.has(callId)
        ) {
          shownCallIds.current.add(callId);
          setIncomingCall({
            type: data.callType || 'voice',
            callerName: data.callerName,
            convId: callId,
          });
        }
        // call শেষ হলে id সরিয়ে দাও যাতে পরে আবার call করা যায়
        if (data.status === 'ended') {
          shownCallIds.current.delete(callId);
        }
      });
    });
    return () => unsub();
  }, [currentUser.id]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (otherUser: ChatUser) => {
    const convId = getConversationId(currentUser.id, otherUser.id);
    setActiveConvId(convId);
    setActiveOtherUser(otherUser);

    // Conversation doc তৈরি করো যদি না থাকে
    const convRef = doc(db, 'conversations', convId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) {
      await setDoc(convRef, {
        participants: [currentUser.id, otherUser.id],
        participantNames: [currentUser.name, otherUser.name],
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
      });
    }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeConvId || !activeOtherUser) return;
    setInputText('');

    await addDoc(collection(db, 'conversations', activeConvId, 'messages'), {
      senderId:   currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      type: 'text',
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'conversations', activeConvId), {
      lastMessage:   text,
      lastMessageAt: serverTimestamp(),
    });
  };

  const startCall = async (type: 'voice' | 'video') => {
    if (!activeConvId || !activeOtherUser) return;

    // ✅ FIX: আগে check করো call আগে থেকে চলছে কিনা
    const existingCall = await getDoc(doc(db, 'calls', activeConvId));
    if (existingCall.exists() && existingCall.data()?.status === 'calling') return;

    await setDoc(doc(db, 'calls', activeConvId), {
      callType:   type,
      callerId:   currentUser.id,
      callerName: currentUser.name,
      calleeId:   activeOtherUser.id,
      calleeName: activeOtherUser.name,
      status:     'calling',
      startedAt:  serverTimestamp(),
    });

    await addDoc(collection(db, 'conversations', activeConvId, 'messages'), {
      senderId:   currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: type === 'voice' ? '📞 Voice Call শুরু করেছে' : '📹 Video Call শুরু করেছে',
      type: 'call_started',
      createdAt: serverTimestamp(),
    });

    setCallModal({ type, isCaller: true });
  };

  // ✅ FIX: call document এ duplicate message guard
  const callMessageSentRef = React.useRef<Set<string>>(new Set());

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    const otherUser = allUsers.find(u => u.name === incomingCall.callerName) || {
      id: incomingCall.convId.replace(currentUser.id, '').replace('__', ''),
      name: incomingCall.callerName,
      role: 'student' as const,
    };
    setActiveOtherUser(otherUser);
    setActiveConvId(incomingCall.convId);
    setCallModal({ type: incomingCall.type, isCaller: false });
    setIncomingCall(null);
  };

  const declineIncomingCall = async () => {
    if (!incomingCall) return;
    await setDoc(doc(db, 'calls', incomingCall.convId), { status: 'ended' }, { merge: true });
    setIncomingCall(null);
  };

  const getOtherName = (conv: Conversation) => {
    const idx = conv.participants.indexOf(currentUser.id);
    return conv.participantNames[idx === 0 ? 1 : 0] || '?';
  };

  const getOtherUser = (conv: Conversation) => {
    const otherId = conv.participants.find(p => p !== currentUser.id);
    return allUsers.find(u => u.id === otherId);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-['Hind_Siliguri']">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden">

        {/* ── LEFT: User list ── */}
        <div className="w-80 flex-shrink-0 border-r border-slate-100 flex flex-col">

          {/* Header */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-800 text-lg">💬 চ্যাট</h2>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all">
                ✕
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="নাম খুঁজুন..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-300 placeholder:text-slate-300"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">🔍</span>
            </div>
          </div>

          {/* Conversations + Users */}
          <div className="flex-1 overflow-y-auto">

            {/* Active conversations */}
            {conversations.length > 0 && (
              <div className="px-3 pt-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">সাম্প্রতিক</p>
                {conversations.map(conv => {
                  const other = getOtherUser(conv);
                  const isActive = conv.id === activeConvId;
                  return (
                    <button key={conv.id}
                      onClick={() => other && openConversation(other)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all mb-1 text-left ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {getOtherName(conv)[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {getOtherName(conv)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                          {conv.lastMessage || 'নতুন কথোপকথন'}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-300 font-bold flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* All users */}
            <div className="px-3 pt-3 pb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">
                {currentUser.role === 'admin' ? 'সবাই' : currentUser.role === 'teacher' ? 'ছাত্র ও অ্যাডমিন' : 'শিক্ষক ও অ্যাডমিন'}
              </p>
              {filteredUsers.map(user => {
                const convId = getConversationId(currentUser.id, user.id);
                const isActive = convId === activeConvId;
                return (
                  <button key={user.id}
                    onClick={() => openConversation(user)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all mb-1 text-left ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      user.role === 'admin' ? 'bg-rose-500 text-white' :
                      user.role === 'teacher' ? 'bg-indigo-500 text-white' :
                      'bg-emerald-500 text-white'
                    }`}>
                      {user.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {user.name}
                      </p>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${roleColor(user.role)}`}>
                        {roleLabel(user.role)}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-center text-slate-300 font-bold text-sm py-8">কেউ পাওয়া যায়নি</p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Chat area ── */}
        <div className="flex-1 flex flex-col">
          {activeOtherUser ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    activeOtherUser.role === 'admin' ? 'bg-rose-500 text-white' :
                    activeOtherUser.role === 'teacher' ? 'bg-indigo-500 text-white' :
                    'bg-emerald-500 text-white'
                  }`}>
                    {activeOtherUser.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{activeOtherUser.name}</p>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${roleColor(activeOtherUser.role)}`}>
                      {roleLabel(activeOtherUser.role)}
                    </span>
                  </div>
                </div>

                {/* Call buttons */}
                <div className="flex items-center gap-2">
                  <button onClick={() => startCall('voice')}
                    className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg hover:bg-emerald-100 transition-all active:scale-90"
                    title="Voice Call">
                    📞
                  </button>
                  <button onClick={() => startCall('video')}
                    className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg hover:bg-indigo-100 transition-all active:scale-90"
                    title="Video Call">
                    📹
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-4xl mb-3">💬</p>
                    <p className="font-black text-slate-400 text-sm">কথোপকথন শুরু করুন!</p>
                    <p className="text-xs text-slate-300 mt-1">{activeOtherUser.name} এর সাথে প্রথম বার্তা পাঠান</p>
                  </div>
                )}

                {messages.map(msg => {
                  const isMe = msg.senderId === currentUser.id;

                  // Call message
                  if (msg.type === 'call_started' || msg.type === 'call_ended') {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white mr-2 flex-shrink-0 mt-1 ${
                          msg.senderRole === 'admin' ? 'bg-rose-500' :
                          msg.senderRole === 'teacher' ? 'bg-indigo-500' : 'bg-emerald-500'
                        }`}>
                          {msg.senderName[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isMe && (
                          <p className="text-[10px] font-black text-slate-400 mb-1 ml-1">{msg.senderName}</p>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <p className={`text-[10px] text-slate-300 font-bold mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={`${activeOtherUser.name} কে বার্তা লিখুন...`}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 transition-all placeholder:text-slate-300"
                  />
                  <button onClick={sendMessage}
                    disabled={!inputText.trim()}
                    className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-100">
                    ➤
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <p className="text-6xl mb-4">💬</p>
              <h3 className="font-black text-slate-700 text-xl mb-2">কথোপকথন শুরু করুন</h3>
              <p className="text-slate-400 font-medium text-sm">
                বাম পাশ থেকে কারো নাম সিলেক্ট করুন
              </p>
              <div className="mt-6 flex gap-3">
                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl">
                  <span className="text-sm">📞</span>
                  <span className="text-xs font-black text-indigo-600">Voice Call</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl">
                  <span className="text-sm">📹</span>
                  <span className="text-xs font-black text-emerald-600">Video Call</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                  <span className="text-sm">💬</span>
                  <span className="text-xs font-black text-slate-600">Messaging</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Call Modal ── */}
      {callModal && activeOtherUser && activeConvId && (
        <CallModal
          type={callModal.type}
          isCaller={callModal.isCaller}
          callerName={callModal.isCaller ? currentUser.name : activeOtherUser.name}
          calleeName={callModal.isCaller ? activeOtherUser.name : currentUser.name}
          conversationId={activeConvId}
          onEnd={() => setCallModal(null)}
        />
      )}

      {/* ── Incoming call notification ── */}
      {incomingCall && !callModal && (
        <div className="fixed bottom-6 right-6 z-[300] bg-white rounded-[24px] shadow-2xl p-5 w-72 border border-slate-100 animate-bounce">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
              {incomingCall.callerName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-black text-slate-800">{incomingCall.callerName}</p>
              <p className="text-xs font-bold text-slate-400">
                {incomingCall.type === 'voice' ? '📞 Voice Call' : '📹 Video Call'} আসছে...
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={acceptIncomingCall}
              className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 transition-all active:scale-95">
              ✅ ধরুন
            </button>
            <button onClick={declineIncomingCall}
              className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-black text-sm hover:bg-rose-600 transition-all active:scale-95">
              ❌ কাটুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
