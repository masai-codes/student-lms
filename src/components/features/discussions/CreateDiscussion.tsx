import {
  Calendar,
  Paperclip,
  Tag,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function CreateDiscussion() {
  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            Introduction To HLD – Server – 5
          </h1>
          <Badge className="bg-green-100 text-green-700">
            LIVE SESSION
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span>User Name</span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>6 Jan, 2026, 6:00 PM (IST)</span>
          </div>

          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            <span>Coding</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Create Discussion */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Create Discussion</h2>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Enter the title" />
          </div>

          {/* Access Type */}
          <div className="space-y-2">
            <Label>Select the type of access</Label>
            <RadioGroup
              defaultValue="private"
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public">Public</Label>
              </div>

              <div className="flex items-center gap-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private">Private</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Editor */}
          <div className="space-y-2">
            <Label>Message</Label>

            {/* Toolbar mock */}
            <div className="flex items-center gap-3 border rounded-t-md px-3 py-2 text-sm text-muted-foreground">
              <span className="font-bold">B</span>
              <span className="italic">I</span>
              <span className="line-through">S</span>
              <span>{"</>"}</span>
              <span>{"{}"}</span>
            </div>

            <Textarea
              placeholder="Type your message..."
              className="rounded-t-none min-h-[180px]"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>

            <Button className="px-6">
              CREATE DISCUSSION
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
