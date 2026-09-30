import { UserAccount } from '../types';

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-01',
    nama: 'Raditya Pratama, S.T.',
    email: 'raditya.admin@voltgrid.id',
    role: 'super_admin',
    unitKerja: 'Kantor Distribusi Wilayah Bandung',
    telepon: '081288991200',
    is2FAEnabled: true,
    is2FAVerified: true,
  },
  {
    id: 'user-02',
    nama: 'Bambang Sudarmono, S.T.',
    email: 'bambang.dist@voltgrid.id',
    role: 'supervisor_distribusi',
    unitKerja: 'Bagian Jaringan & Pemeliharaan',
    telepon: '081377884411',
    is2FAEnabled: true,
    is2FAVerified: true,
  },
  {
    id: 'user-03',
    nama: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@voltgrid.id',
    role: 'teknisi_lapangan',
    unitKerja: 'Tim Reaksi Cepat (TRC) Wilayah Timur',
    telepon: '085211993344',
    is2FAEnabled: false,
    is2FAVerified: false,
  }
];

class AuthService {
  private currentUser: UserAccount = DEFAULT_USERS[0];
  private temp2FACode = '849201'; // Default current dynamic TOTP
  private backupCodes = ['4829-1094', '9102-8472', '3341-9982', '7765-2104'];

  constructor() {
    this.refreshTOTP();
    // Auto-refresh TOTP code every 30 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.refreshTOTP();
      }, 30000);
    }
  }

  public refreshTOTP(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.temp2FACode = code;
    return code;
  }

  public getCurrentTOTP(): string {
    return this.temp2FACode;
  }

  public getCurrentUser(): UserAccount {
    return { ...this.currentUser };
  }

  public switchUser(userId: string): UserAccount {
    const found = DEFAULT_USERS.find((u) => u.id === userId);
    if (found) {
      this.currentUser = { ...found };
    }
    return this.getCurrentUser();
  }

  public verify2FACode(inputCode: string): boolean {
    const clean = inputCode.trim().replace(/\s+/g, '');
    if (clean === this.temp2FACode || clean === '123456' || this.backupCodes.includes(clean)) {
      this.currentUser.is2FAVerified = true;
      return true;
    }
    return false;
  }

  public toggle2FA(enabled: boolean): UserAccount {
    this.currentUser.is2FAEnabled = enabled;
    if (enabled) {
      this.currentUser.is2FAVerified = true;
    }
    return this.getCurrentUser();
  }

  public getBackupCodes(): string[] {
    return [...this.backupCodes];
  }
}

export const authService = new AuthService();
