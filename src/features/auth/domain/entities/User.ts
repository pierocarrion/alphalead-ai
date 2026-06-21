export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  role: string | null;
  hardMoment: string | null;
  profileId: string | null;
  onboarded: boolean;
  tone: "warm" | "balanced";
}
