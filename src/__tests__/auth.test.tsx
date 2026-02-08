import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    return <img {...props} />;
  },
}));

const mockSignInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null });
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});

vi.mock("@/lib/supabase-browser", () => ({
  createSupabaseBrowser: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signOut: mockSignOut,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {
    full_name: "테스트 유저",
    avatar_url: "https://example.com/avatar.jpg",
  },
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
} as User;

describe("LoginButton", () => {
  it("renders Google login button", async () => {
    const { LoginButton } = await import("@/components/auth/LoginButton");
    render(<LoginButton />);
    expect(screen.getByText("Google 로그인")).toBeInTheDocument();
  });

  it("calls signInWithOAuth on click", async () => {
    const { LoginButton } = await import("@/components/auth/LoginButton");
    render(<LoginButton />);
    fireEvent.click(screen.getByText("Google 로그인"));
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: expect.stringContaining("/auth/callback"),
      },
    });
  });
});

describe("UserMenu", () => {
  it("renders user name and avatar", async () => {
    const { UserMenu } = await import("@/components/auth/UserMenu");
    render(<UserMenu user={mockUser} />);
    const avatar = screen.getByAltText("테스트 유저");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("shows display name on wider screens", async () => {
    const { UserMenu } = await import("@/components/auth/UserMenu");
    render(<UserMenu user={mockUser} />);
    expect(screen.getByText("테스트 유저")).toBeInTheDocument();
  });

  it("shows dropdown on click", async () => {
    const { UserMenu } = await import("@/components/auth/UserMenu");
    render(<UserMenu user={mockUser} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("로그아웃")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("calls signOut and redirects on logout click", async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    const { UserMenu } = await import("@/components/auth/UserMenu");
    render(<UserMenu user={mockUser} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("로그아웃"));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("closes dropdown on outside click", async () => {
    const { UserMenu } = await import("@/components/auth/UserMenu");
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <UserMenu user={mockUser} />
      </div>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("로그아웃")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("로그아웃")).not.toBeInTheDocument();
  });

  it("renders initial fallback when no avatar", async () => {
    const noAvatarUser = {
      ...mockUser,
      user_metadata: { full_name: "김철수" },
    } as User;
    const { UserMenu } = await import("@/components/auth/UserMenu");
    render(<UserMenu user={noAvatarUser} />);
    expect(screen.getByText("김")).toBeInTheDocument();
  });

  it("falls back to email when no full_name", async () => {
    const emailOnlyUser = {
      ...mockUser,
      user_metadata: {},
    } as User;
    const { UserMenu } = await import("@/components/auth/UserMenu");
    render(<UserMenu user={emailOnlyUser} />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });
});

describe("AuthProvider + AuthHeader", () => {
  it("shows LoginButton when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockReturnValueOnce({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    const { AuthHeader } = await import("@/components/auth/AuthHeader");

    await act(async () => {
      render(
        <AuthProvider>
          <AuthHeader />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Google 로그인")).toBeInTheDocument();
    });
  });

  it("shows UserMenu when authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    mockOnAuthStateChange.mockReturnValueOnce({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    const { AuthHeader } = await import("@/components/auth/AuthHeader");

    await act(async () => {
      render(
        <AuthProvider>
          <AuthHeader />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByAltText("테스트 유저")).toBeInTheDocument();
    });
  });

  it("shows loading skeleton initially", async () => {
    mockGetUser.mockReturnValueOnce(new Promise(() => {}));
    mockOnAuthStateChange.mockReturnValueOnce({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    const { AuthHeader } = await import("@/components/auth/AuthHeader");

    render(
      <AuthProvider>
        <AuthHeader />
      </AuthProvider>
    );

    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("updates user on auth state change", async () => {
    let authCallback: (event: string, session: { user: User } | null) => void;
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockImplementationOnce((cb: typeof authCallback) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    const { AuthHeader } = await import("@/components/auth/AuthHeader");

    await act(async () => {
      render(
        <AuthProvider>
          <AuthHeader />
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Google 로그인")).toBeInTheDocument();
    });

    await act(async () => {
      authCallback!("SIGNED_IN", { user: mockUser });
    });

    await waitFor(() => {
      expect(screen.getByAltText("테스트 유저")).toBeInTheDocument();
    });
  });

  it("unsubscribes on unmount", async () => {
    const unsubscribe = vi.fn();
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    mockOnAuthStateChange.mockReturnValueOnce({
      data: { subscription: { unsubscribe } },
    });

    const { AuthProvider } = await import("@/components/auth/AuthProvider");
    const { AuthHeader } = await import("@/components/auth/AuthHeader");

    const { unmount } = render(
      <AuthProvider>
        <AuthHeader />
      </AuthProvider>
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
