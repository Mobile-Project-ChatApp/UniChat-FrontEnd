export default interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  profilePicture: string;
  createdAt: string;
  semester?: number;
  study?: string;
  refreshToken?: string;
  refreshTokenExpiry?: string;
  // IsAdmin: Boolean;
  // status: string;
}
