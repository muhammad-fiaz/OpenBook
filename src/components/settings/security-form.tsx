"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client"; 

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
    newEmail: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required to confirm changes"),
});

export function SecurityForm() {
  const [isPasswordPending, setIsPasswordPending] = useState(false);
  const [isEmailPending, setIsEmailPending] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: "",
      password: "",
    },
  });

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    setIsPasswordPending(true);
    try {
      const { error } = await authClient.changePassword({
          newPassword: values.newPassword,
          currentPassword: values.currentPassword,
          revokeOtherSessions: true,
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsPasswordPending(false);
    }
  }

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setIsEmailPending(true);
    try {
        const { error } = await authClient.changeEmail({
            newEmail: values.newEmail,
            callbackURL: "/user/settings", // Redirect back here
        });
        
        if (error) throw error;
        toast.success("Verification email sent to new address");
        emailForm.reset();
    } catch (error: any) {
        toast.error(error.message || "Failed to update email");
    } finally {
        setIsEmailPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                        <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                        <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <Button type="submit" disabled={isPasswordPending}>
                {isPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

    <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
          <CardDescription>
            Update your email address. You will need to verify the new email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="new@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={emailForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm with Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Current password" {...field} />
                    </FormControl>
                    <p className="text-[0.8rem] text-muted-foreground bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">
                        Note: We'll send a verification link to your new email.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isEmailPending}>
                {isEmailPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Email
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
