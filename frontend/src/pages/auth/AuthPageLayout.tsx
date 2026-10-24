import React from "react";
import { Link } from "react-router";
import { DarkThemeToggle } from "flowbite-react";
import BrandLogo from "../../common/BrandLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
      <div className="relative flex h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
        {children}

        <div className="relative hidden h-full w-full items-center overflow-hidden bg-linear-to-br from-brand-700 via-brand-900 to-brand-950 lg:grid lg:w-1/2 dark:bg-none dark:bg-white/5">
          <div className="pointer-events-none absolute -top-16 -right-16 size-72 rounded-full bg-finora-lime/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 size-72 rounded-full bg-finora-gold/10 blur-3xl" />

          <div className="relative z-1 flex items-center justify-center">
            <div className="flex max-w-xs flex-col items-center">
              <Link to="/" className="mb-5 block">
                <div className="flex flex-col items-center gap-3">
                  <img
                    src="/images/logo/logo.png"
                    alt="Finora"
                    width={160}
                    height={160}
                    className="object-contain drop-shadow-2xl"
                  />
                  <span className="text-4xl font-semibold tracking-tight text-white">
                    Finora
                  </span>
                </div>
              </Link>
              <p className="text-center text-lg text-finora-lime">
                Where your money finds its flow.
              </p>
              <p className="mt-3 text-center text-sm text-brand-100/80">
                Track, budget and grow, all in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="fixed inset-e-6 bottom-6 z-50 hidden sm:block">
          <DarkThemeToggle />
        </div>
      </div>
    </div>
  );
}