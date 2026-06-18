export const auth = async () => ({ userId: "mock-user-123" });

export const currentUser = async () => ({
  id: "mock-user-123",
  firstName: "Mock",
  lastName: "User",
  emailAddresses: [{ emailAddress: "mock@example.com" }],
  imageUrl: ""
});

export const useAuth = () => ({ userId: "mock-user-123", isSignedIn: true });

export const useUser = () => ({ 
  user: { id: "mock-user-123", fullName: "Mock User", imageUrl: "" }, 
  isSignedIn: true 
});

export const UserButton = () => {
  return (
    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm border border-purple-500">
      M
    </div>
  );
};
