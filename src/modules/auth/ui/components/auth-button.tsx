"use client";

import { ClapperboardIcon, UserCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button";

export const AuthButton = () => {
  return <>
    <Button
      variant="outline"
      className="
        px-4 py-2 
        text-sm font-medium text-blue-600 
        hover:text-blue-500 hover:cursor-pointer 
        border-blue-500/20 rounded-full shadow-none"
    >
      <UserCircleIcon/>
      Sign in
    </Button>
  </>
}