 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 import { GlassCard } from '@/components/GlassCard';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { motion } from 'framer-motion';
 import { Loader2, Mail, Lock, User, Wallet } from 'lucide-react';
 import { z } from 'zod';
 
 const emailSchema = z.string().email('Email non valida');
 const passwordSchema = z.string().min(6, 'Password deve avere almeno 6 caratteri');
 
 export default function Auth() {
   const navigate = useNavigate();
   const { signIn, signUp, isAuthenticated } = useAuth();
   const [loading, setLoading] = useState(false);
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
           <h1 className="font-display text-3xl font-bold">FinanzApp</h1>
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