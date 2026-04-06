export default function Footer() {
  return (
    <footer className="w-full bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <p className="font-extrabold tracking-widest uppercase">VOLUME PASS</p>
        <p className="text-gray-400">&copy; {new Date().getFullYear()} Volume Brussels. All rights reserved.</p>
      </div>
    </footer>
  );
}
