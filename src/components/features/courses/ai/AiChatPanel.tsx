import { MessageCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AiChatPanel() {
  return (
    <div className="flex flex-col h-full gap-4">
      <ScrollArea className="flex-1">
        <div className="text-center text-muted-foreground mt-20">
          Ask me anything about this lecture
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input placeholder="Type your question..." />
        <Button size="icon">
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
