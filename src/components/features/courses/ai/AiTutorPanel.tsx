import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AiTutorPanel() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 min-h-[500px]">
        <img
          src="/AITutor.svg"
          className="mx-auto rounded-full"
        />
        <h3 className="font-semibold">Hello, I’m your AI Tutor</h3>
        <p className="text-sm text-muted-foreground">
          Select a language to start a conversation
        </p>

        <Select>
          <SelectTrigger className="w-full justify-between">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="hi">Hindi</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  )
}
