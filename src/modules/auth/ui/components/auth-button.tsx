"use client";

import { ClapperboardIcon, UserCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button";

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

export const AuthButton = () => {
  return (
    // 空标签表示不渲染任何DOM元素
    // 在返回多个元素时，不用必须被div包裹，不影响布局、样式
    <>
      <SignedIn>
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link
              label="Studio"
              href="/studio"
              labelIcon={<ClapperboardIcon className="size-4" />}
            />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
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
        </SignInButton>
      </SignedOut>
    </>
  )
}