import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";

export default function AuthTabs() {
  return (
    <div className="min-h-dvh p-4 flex items-start justify-center">
      <div className="w-full max-w-md">
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="register">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="login"><LoginScreen /></TabsContent>
          <TabsContent value="register"><RegisterScreen /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
