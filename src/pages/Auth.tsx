import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, Wallet } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
 
 const emailSchema = z.string().email('Email non valida');
 const passwordSchema = z.string().min(6, 'Password deve avere almeno 6 caratteri');
 
 export default function Auth() {
   const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
   
   // Login form state
   const [loginEmail, setLoginEmail] = useState('');
   const [loginPassword, setLoginPassword] = useState('');
   
   // Signup form state
   const [signupEmail, setSignupEmail] = useState('');
   const [signupPassword, setSignupPassword] = useState('');
   const [signupName, setSignupName] = useState('');
 
   // Redirect if already authenticated
   if (isAuthenticated) {
     navigate('/', { replace: true });
     return null;
   }
 
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setError(null);
     
     // Validate
     const emailResult = emailSchema.safeParse(loginEmail);
     if (!emailResult.success) {
       setError(emailResult.error.errors[0].message);
       return;
     }
     
     const passwordResult = passwordSchema.safeParse(loginPassword);
     if (!passwordResult.success) {
       setError(passwordResult.error.errors[0].message);
       return;
     }
     
     setLoading(true);
     const { error } = await signIn(loginEmail, loginPassword);
     setLoading(false);
     
     if (error) {
       setError(error.message);
     } else {
       navigate('/', { replace: true });
     }
   };
 
   const handleSignup = async (e: React.FormEvent) => {
     e.preventDefault();
     setError(null);
     
     // Validate
     const emailResult = emailSchema.safeParse(signupEmail);
     if (!emailResult.success) {
       setError(emailResult.error.errors[0].message);
       return;
     }
     
     const passwordResult = passwordSchema.safeParse(signupPassword);
     if (!passwordResult.success) {
       setError(passwordResult.error.errors[0].message);
       return;
     }
     
     setLoading(true);
     const { error } = await signUp(signupEmail, signupPassword, signupName);
     setLoading(false);
     
    if (error) {
      setError(error.message);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError(null);
    setSocialLoading(provider);
    
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    
    setSocialLoading(null);
    
    if (error) {
      toast.error(`Errore con ${provider === 'google' ? 'Google' : 'Apple'}: ${error.message}`);
    }
  };

  return (
     <div className="min-h-screen bg-background flex items-center justify-center p-4">
       {/* Background effects */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
       </div>
 
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
         className="w-full max-w-md relative z-10"
       >
         <div className="text-center mb-8">
           <motion.div
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
             className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 mb-4"
           >
             <Wallet className="w-8 h-8 text-primary-foreground" />
           </motion.div>
           <h1 className="font-display text-3xl font-bold">FinanceFlow</h1>
           <p className="text-muted-foreground mt-2">
             Gestisci le tue finanze in modo intelligente
           </p>
         </div>
 
         <GlassCard className="p-6">
           <Tabs defaultValue="login" className="w-full">
             <TabsList className="grid w-full grid-cols-2 mb-6">
               <TabsTrigger value="login">Accedi</TabsTrigger>
               <TabsTrigger value="signup">Registrati</TabsTrigger>
             </TabsList>
 
             <TabsContent value="login">
               <form onSubmit={handleLogin} className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="login-email">Email</Label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="login-email"
                       type="email"
                       placeholder="tuaemail@esempio.com"
                       value={loginEmail}
                       onChange={(e) => setLoginEmail(e.target.value)}
                       className="pl-10"
                       required
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="login-password">Password</Label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="login-password"
                       type="password"
                       placeholder="••••••••"
                       value={loginPassword}
                       onChange={(e) => setLoginPassword(e.target.value)}
                       className="pl-10"
                       required
                     />
                   </div>
                 </div>
 
                 {error && (
                   <motion.p
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                   >
                     {error}
                   </motion.p>
                 )}
 
                 <Button type="submit" className="w-full" disabled={loading}>
                   {loading ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Accesso in corso...
                     </>
                   ) : (
                     'Accedi'
                   )}
                  </Button>

                  <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      oppure
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('google')}
                      disabled={socialLoading !== null}
                      className="w-full"
                    >
                      {socialLoading === 'google' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('apple')}
                      disabled={socialLoading !== null}
                      className="w-full"
                    >
                      {socialLoading === 'apple' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                          Apple
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
 
             <TabsContent value="signup">
               <form onSubmit={handleSignup} className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="signup-name">Nome (opzionale)</Label>
                   <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="signup-name"
                       type="text"
                       placeholder="Il tuo nome"
                       value={signupName}
                       onChange={(e) => setSignupName(e.target.value)}
                       className="pl-10"
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="signup-email">Email</Label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="signup-email"
                       type="email"
                       placeholder="tuaemail@esempio.com"
                       value={signupEmail}
                       onChange={(e) => setSignupEmail(e.target.value)}
                       className="pl-10"
                       required
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="signup-password">Password</Label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       id="signup-password"
                       type="password"
                       placeholder="Minimo 6 caratteri"
                       value={signupPassword}
                       onChange={(e) => setSignupPassword(e.target.value)}
                       className="pl-10"
                       required
                     />
                   </div>
                 </div>
 
                 {error && (
                   <motion.p
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                   >
                     {error}
                   </motion.p>
                 )}
 
                 <Button type="submit" className="w-full" disabled={loading}>
                   {loading ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Registrazione...
                     </>
                   ) : (
                     'Crea Account'
                   )}
                  </Button>

                  <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      oppure
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('google')}
                      disabled={socialLoading !== null}
                      className="w-full"
                    >
                      {socialLoading === 'google' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('apple')}
                      disabled={socialLoading !== null}
                      className="w-full"
                    >
                      {socialLoading === 'apple' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                          Apple
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
           </Tabs>
         </GlassCard>
 
         <p className="text-center text-xs text-muted-foreground mt-6">
           I tuoi dati sono protetti e crittografati
         </p>
       </motion.div>
     </div>
   );
 }