import React from "react";
import { Ghost, Home } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col bg-primary-dark">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 text-cyan-primary">
          <Ghost size={48} />
        </div>
        <h1 className="mt-8 text-5xl font-black tracking-tight text-white sm:text-7xl">
          404
        </h1>
        <p className="mt-4 text-xl font-bold text-white">Page Not Found</p>
        <p className="mx-auto mt-4 max-w-[400px] text-light-gray/60">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-10 flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-black transition-transform hover:scale-105"
        >
          <Home size={20} />
          Go Home
        </Link>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
