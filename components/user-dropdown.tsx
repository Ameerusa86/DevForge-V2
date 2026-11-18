import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Award,
  Bell,
  BookOpen,
  LogOut,
  User,
  LayoutDashboard,
} from "lucide-react";
import { getProxiedImageUrl } from "@/lib/s3-utils";

interface UserDropdownProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

// User Dropdown Menu Component
// Displays user avatar and provides dropdown menu with profile and logout options
export function UserDropdown({ user }: UserDropdownProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Extract initials from user name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle user logout
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to logout");
    } finally {
      setIsLoading(false);
    }
  };

  const avatarSrc = user.image ? getProxiedImageUrl(user.image) : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-border/60">
            {/* Display user image if available */}
            <AvatarImage src={avatarSrc} alt={user.name} className="object-cover" />
            {/* Fallback to initials if no image */}
            <AvatarFallback className="bg-[#ff6636]/10 text-xs font-bold text-[#ff6636]">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      {/* Dropdown Menu Content */}
      <DropdownMenuContent align="end" className="w-56">
        {/* User Info Header */}
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Dashboard Link */}
        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>

        {/* My Courses Link */}
        <DropdownMenuItem
          onClick={() => router.push("/my-courses")}
          className="cursor-pointer"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          <span>My Courses</span>
        </DropdownMenuItem>

        {/* Certificates Link */}
        <DropdownMenuItem
          onClick={() => router.push("/certificates")}
          className="cursor-pointer"
        >
          <Award className="mr-2 h-4 w-4" />
          <span>Certificates</span>
        </DropdownMenuItem>

        {/* Profile Link */}
        <DropdownMenuItem
          onClick={() => router.push("/profile")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Notifications Link */}
        <DropdownMenuItem
          onClick={() => router.push("/notifications")}
          className="cursor-pointer"
        >
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout Button */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
          disabled={isLoading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? "Logging out..." : "Logout"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
