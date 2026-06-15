import LoginForm from "@/features/auth/components/login-form";
import { requireUnauth } from "@/lib/auth-untils";
import React from "react";

const Page = async () => {
  await requireUnauth();
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
};

export default Page;
