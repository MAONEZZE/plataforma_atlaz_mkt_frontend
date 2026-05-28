import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DadosPessoaisForm } from "./DadosPessoaisForm";
import { SegurancaForm } from "./SegurancaForm";

export default function PerfilPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Configurações da conta</h1>
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" className="mt-6">
          <DadosPessoaisForm />
        </TabsContent>
        <TabsContent value="seguranca" className="mt-6">
          <SegurancaForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
