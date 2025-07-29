import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Phone, 
  Mail, 
  Key,
  CheckCircle,
  AlertCircle,
  Clock,
  Copy,
  QrCode
} from "lucide-react";
import { motion } from "framer-motion";

interface TwoFactorSetup {
  id?: number;
  userId: string;
  phoneNumber?: string;
  email?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  backupCodes?: string[];
  lastVerifiedAt?: string;
}

interface VerificationCode {
  code: string;
  expiresAt: string;
  codeType: 'sms' | 'email';
}

export default function TwoFactorAuth({ userId }: { userId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<'setup' | 'verify-phone' | 'verify-email' | 'complete'>('setup');
  const [pendingVerification, setPendingVerification] = useState<VerificationCode | null>(null);

  // Fetch 2FA status
  const { data: twoFactorStatus, isLoading } = useQuery<TwoFactorSetup>({
    queryKey: ['/api/auth/2fa', userId],
    retry: false,
  });

  // Setup 2FA mutation
  const setup2FAMutation = useMutation({
    mutationFn: async (data: { phoneNumber?: string; email?: string }) => {
      return await apiRequest('POST', '/api/auth/2fa/setup', { ...data, userId });
    },
    onSuccess: (data) => {
      setPendingVerification(data.verificationCode);
      setStep(data.verificationCode.codeType === 'sms' ? 'verify-phone' : 'verify-email');
      toast({
        title: "Verification Code Sent",
        description: `Check your ${data.verificationCode.codeType === 'sms' ? 'phone' : 'email'} for the verification code.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify code mutation
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('POST', '/api/auth/2fa/verify', { 
        userId, 
        code, 
        codeType: pendingVerification?.codeType 
      });
    },
    onSuccess: (data) => {
      if (data.isComplete) {
        setStep('complete');
        toast({
          title: "2FA Setup Complete",
          description: "Your account is now secured with two-factor authentication.",
        });
      } else {
        // Continue to next verification step
        setPendingVerification(data.nextVerification);
        setStep(data.nextVerification.codeType === 'sms' ? 'verify-phone' : 'verify-email');
      }
      queryClient.invalidateQueries({ queryKey: ['/api/auth/2fa', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disable 2FA mutation
  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/auth/2fa/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/2fa', userId] });
      setStep('setup');
    },
  });

  // Generate backup codes mutation
  const generateBackupCodesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/auth/2fa/${userId}/backup-codes`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/2fa', userId] });
      toast({
        title: "Backup Codes Generated",
        description: "New backup codes have been created. Save them securely.",
      });
    },
  });

  const handleSetup = () => {
    if (!phoneNumber && !email) {
      toast({
        title: "Required Information",
        description: "Please provide at least a phone number or email address.",
        variant: "destructive",
      });
      return;
    }

    setup2FAMutation.mutate({ phoneNumber, email });
  };

  const handleVerify = () => {
    if (!verificationCode) {
      toast({
        title: "Code Required",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }

    verifyCodeMutation.mutate(verificationCode);
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Backup code copied to clipboard.",
    });
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If 2FA is already setup and verified
  if (twoFactorStatus?.isPhoneVerified || twoFactorStatus?.isEmailVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Two-Factor Authentication
            <Badge className="bg-green-100 text-green-800">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone Verification Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">Phone</span>
                  </div>
                  {twoFactorStatus.isPhoneVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {twoFactorStatus.phoneNumber ? 
                    `***-***-${twoFactorStatus.phoneNumber.slice(-4)}` : 
                    'Not configured'
                  }
                </div>
              </CardContent>
            </Card>

            {/* Email Verification Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email</span>
                  </div>
                  {twoFactorStatus.isEmailVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {twoFactorStatus.email ? 
                    `${twoFactorStatus.email.slice(0, 3)}***@${twoFactorStatus.email.split('@')[1]}` : 
                    'Not configured'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backup Codes */}
          {twoFactorStatus.backupCodes && twoFactorStatus.backupCodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Backup Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {twoFactorStatus.backupCodes.map((code, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded font-mono text-sm"
                    >
                      <span>{code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyBackupCode(code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => generateBackupCodesMutation.mutate()}
                  disabled={generateBackupCodesMutation.isPending}
                >
                  Generate New Codes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Management Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Last verified: {twoFactorStatus.lastVerifiedAt ? 
                new Date(twoFactorStatus.lastVerifiedAt).toLocaleDateString() : 
                'Never'
              }
            </div>
            <Button
              variant="destructive"
              onClick={() => disable2FAMutation.mutate()}
              disabled={disable2FAMutation.isPending}
            >
              Disable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'setup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-sm text-gray-600">
              Secure your account with two-factor authentication. We'll send verification codes to your phone or email.
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <Button 
              onClick={handleSetup}
              disabled={setup2FAMutation.isPending || (!phoneNumber && !email)}
              className="w-full"
            >
              {setup2FAMutation.isPending ? 'Setting up...' : 'Setup Two-Factor Authentication'}
            </Button>
          </motion.div>
        )}

        {(step === 'verify-phone' || step === 'verify-email') && pendingVerification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {step === 'verify-phone' ? (
                  <Phone className="h-8 w-8 text-blue-600" />
                ) : (
                  <Mail className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold">
                Verify Your {step === 'verify-phone' ? 'Phone' : 'Email'}
              </h3>
              <p className="text-sm text-gray-600">
                We sent a verification code to your {step === 'verify-phone' ? 'phone number' : 'email address'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-lg tracking-wider"
                />
              </div>

              <div className="text-center text-sm text-gray-600">
                <Clock className="h-4 w-4 inline mr-1" />
                Code expires in {formatTimeRemaining(pendingVerification.expiresAt)}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('setup')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleVerify}
                disabled={verifyCodeMutation.isPending || !verificationCode}
                className="flex-1"
              >
                {verifyCodeMutation.isPending ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Two-Factor Authentication Enabled
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Your account is now protected with two-factor authentication. 
                Make sure to save your backup codes in a secure location.
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}