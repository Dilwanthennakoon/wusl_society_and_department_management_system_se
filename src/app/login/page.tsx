import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061b4f] via-[#12328a] to-[#4b1d95] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 overflow-hidden p-3">
            <Image
              src="/images/uni.png"
              alt="University Logo"
              width={70}
              height={70}
              className="object-contain"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            University Management System
          </h1>

          <p className="text-blue-100 mt-4 text-lg">
            Choose your management section
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Society Card */}
          <Link
            href="/society_login"
            className="group relative overflow-hidden rounded-[2rem] bg-white/95 p-10 shadow-2xl border border-white/40 hover:-translate-y-2 transition-all duration-300"
          >
            {/* Decorative Shapes */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-100 rounded-full group-hover:bg-blue-200 transition"></div>
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-50 rounded-full"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-3xl flex items-center justify-center text-4xl font-extrabold shadow-xl group-hover:scale-110 transition">
                S
              </div>

              <h2 className="text-4xl font-extrabold text-gray-800 mt-8 mb-4">
                Society
              </h2>

              <p className="text-gray-600 leading-relaxed max-w-md mb-8">
                Manage university societies, student registrations, members,
                events, tasks, reports, and notifications.
              </p>

              <div className="flex items-center gap-3 text-blue-700 font-semibold mb-8">
                <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                <span>Society Management Section</span>
              </div>

              <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg group-hover:shadow-xl group-hover:scale-105 transition">
                Continue
              </span>
            </div>
          </Link>

          {/* Department Card */}
          <Link
            href="/department-login"
            className="group relative overflow-hidden rounded-[2rem] bg-white/95 p-10 shadow-2xl border border-white/40 hover:-translate-y-2 transition-all duration-300"
          >
            {/* Decorative Shapes */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-purple-100 rounded-full group-hover:bg-purple-200 transition"></div>
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-purple-50 rounded-full"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-fuchsia-700 text-white rounded-3xl flex items-center justify-center text-4xl font-extrabold shadow-xl group-hover:scale-110 transition">
                D
              </div>

              <h2 className="text-4xl font-extrabold text-gray-800 mt-8 mb-4">
                Department
              </h2>

              <p className="text-gray-600 leading-relaxed max-w-md mb-8">
                Manage university departments, academic details, department
                users, students, notices, activities, and reports.
              </p>

              <div className="flex items-center gap-3 text-purple-700 font-semibold mb-8">
                <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                <span>Department Management Section</span>
              </div>

              <span className="bg-gradient-to-r from-purple-600 to-fuchsia-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg group-hover:shadow-xl group-hover:scale-105 transition">
                Continue
              </span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-blue-100">
            University Society and Department Management Platform
          </p>
        </div>
      </div>
    </div>
  );
}
