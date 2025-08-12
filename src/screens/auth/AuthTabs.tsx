import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import AuthScaffold from "./AuthScaffold";

export default function AuthTabs() {
  return (
    <AuthScaffold>
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
    </AuthScaffold>
  );
}
