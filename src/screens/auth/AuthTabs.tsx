import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import EnvelopesLogo from "../../components/common/EnvelopesLogo";

export default function AuthTabs() {
  return (
    <div className="min-h-dvh bg-[color:var(--owl-bg)] text-[color:var(--owl-text-primary)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <EnvelopesLogo variant="full" height={44} className="select-none" />
          <p className="mt-2 text-sm text-[color:var(--owl-text-secondary)]">Welcome back to budgeting that feels right.</p>
        </div>
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="register">Create account</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="login"><LoginScreen /></TabsContent>
            <TabsContent value="register"><RegisterScreen /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
