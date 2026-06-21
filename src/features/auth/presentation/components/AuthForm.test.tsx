import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthForm } from "./AuthForm";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

import { signIn } from "next-auth/react";

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders signup form by default", () => {
    render(<AuthForm />);
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("switches to login mode", () => {
    render(<AuthForm />);
    fireEvent.click(screen.getByRole("button", { name: /already have an account/i }));

    expect(screen.queryByPlaceholderText("Your name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("submits signup then signs in", async () => {
    vi.mocked(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "1", email: "test@example.com" } }),
    } as Response);
    vi.mocked(signIn).mockResolvedValueOnce({ ok: true, error: undefined } as never);

    render(<AuthForm />);
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/signup", expect.any(Object));
    });

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        mode: "login",
        redirect: false,
      });
    });

    expect(push).toHaveBeenCalledWith("/onboarding");
  });

  it("shows error when sign in fails", async () => {
    vi.mocked(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "1" } }),
    } as Response);
    vi.mocked(signIn).mockResolvedValueOnce({ ok: false, error: "Invalid credentials" } as never);

    render(<AuthForm />);
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByText("Invalid credentials");
  });
});
