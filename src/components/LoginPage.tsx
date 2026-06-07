import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Sparkles } from 'lucide-react';
import React from 'react';
// 1. استيراد عميل سوبابيز الذي قمت بإنشائه
import { supabase } from '../supabaseClient'; 

interface LoginPageProps {
  onLogin: (userType: 'patient' | 'dermatologist') => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [userType, setUserType] = useState<'patient' | 'dermatologist'>('patient');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [activeTab, setActiveTab] = useState('login'); 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // حالة للتحميل أثناء الطلب

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'signup') {
        // التحقق من تطابق كلمتي المرور
        if (password !== confirmPassword) {
          setError("Passwords do not match. Please ensure both passwords are identical.");
          setLoading(false);
          return; 
        }

        // 2. منطق الاشتراك (Sign Up) في سوبابيز
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              gender: gender,
              birth_date: birthDate,
              user_type: userType,
            },
          },
        });

        if (signUpError) throw signUpError;
        
        console.log('Sign Up successful:', data);
      } else {
        // 3. منطق تسجيل الدخول (Login) في سوبابيز
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        console.log('Login successful:', data);
      }

      // في حال النجاح، انتقل للصفحة الرئيسية
      onLogin(userType); 

    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setEmail('');
    setPassword('');
    setName('');
    setGender('');
    setBirthDate('');
    setConfirmPassword('');
    setError(null);
  };

  return (
    <div className="light min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ colorScheme: 'light' }}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-6 text-center lg:text-left">
            <div className="hidden lg:block">
              <ImageWithFallback src="../logo.png" />
            </div>
          </div>

          <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/80">
            <CardHeader>
              <CardTitle>Welcome to Skinova</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                {error && (
                  <div className="p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                    {error}
                  </div>
                )}
                
                <TabsContent value="login">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
    
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      {loading ? "Processing..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="uName">Patient Name</Label>
                      <Input
                        id="uName"
                        type="text"
                        placeholder="Ziad Talat"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="DOB">Date of Birth</Label>
                      <Input
                        id="DOB"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
       
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block mb-1 text-base font-medium text-black">
                        Gender
                      </label>
                      <Tabs value={gender} onValueChange={setGender} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-12">
                          <TabsTrigger value="male">♂ Male</TabsTrigger>
                          <TabsTrigger value="female">♀ Female</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}