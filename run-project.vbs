Set shell = CreateObject("WScript.Shell")

' ফোল্ডার পাথ (পাথে স্পেস থাকলেও যেন সমস্যা না হয় তাই কোটেশন ব্যবহার করা হয়েছে)
shell.CurrentDirectory = "C:\Users\SHAHRIAR\Downloads\eduquiz"

' কমান্ডটি রান করুন। 
' এখানে '0' মানে হলো কমান্ড প্রম্পট উইন্ডোটি হাইড হয়ে থাকবে।
shell.Run "cmd /c npm run dev", 0, False

' সার্ভার পুরোপুরি রেডি হওয়ার জন্য ৭ সেকেন্ড সময় দিন (আপনার পিসি স্লো হলে সময় বাড়াতে পারেন)
WScript.Sleep 7000

' ব্রাউজারে অ্যাপটি ওপেন করুন
shell.Run "http://localhost:3000"