import { useState } from "react"
import { Mail, Phone } from "lucide-react"
import type { User } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

type ProfilePageProps = {
  user: User
}

export default function ProfilePage({ user }: ProfilePageProps) {

  const [activeTab, setActiveTab] = useState("profile")

  const tabButtons = [
    { key: "profile", label: "Profile Details" },
    { key: "integration", label: "Integrations" },
    { key: "ack", label: "Acknowledgement" },
    { key: "activity", label: "Account Activity" },
  ]

  return (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-semibold py-6">My Profile</h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user.profileImageUrl ?? undefined}
              alt={user.name}
            />
            <AvatarFallback className="bg-gray-400 text-3xl text-white">
              {user.name
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Plus badge */}
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#6962AC] text-white border-2 border-white">
            +
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold">{user.name}</h3>

          <div className="flex items-center">
            <Mail color="#6C7280" size={18} />
            <p className="text-[#626A77] ml-2">{user.email ?? "-"}</p>
          </div>

          <div className="flex items-center">
            <Phone color="#6C7280" size={18} />
            <p className="text-[#626A77] ml-2">{user.mobile?.trim() || '-'}</p>
          </div>
        </div>

      </div>

      {/* <ProfilePageTab /> */}

      <div className="flex flex-col flex-1">
        <div className="flex">
          {tabButtons.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === tab.key
                ? "text-[#7A74B6] border border-b-0 rounded-t-xl bg-white"
                : "text-gray-500 hover:text-[#7A74B6]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="">
          {activeTab === "profile" && <ProfileDetailsTab userName={user.name} />}
          {activeTab === "integration" && <IntegrationTab />}
          {activeTab === "ack" && <AcknowledgementTab />}
          {activeTab === "activity" && <ActivityTab />}
        </div>
      </div>

    </div>
  )
}

function ProfileDetailsTab({ userName }: { userName: string }) {
  return (
    <div className="bg-white border rounded-b-xl rounded-tr-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoCard title="Name" value={userName} />
      <InfoCard title="Mobile Number" value="+91 9742658112" />
      <InfoCard title="Password" value="••••••••••••" />
    </div>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="border rounded-xl p-5 flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-lg font-medium text-gray-800">{value}</p>
      </div>
      <button className="text-[#6962AC] text-sm font-semibold hover:underline">
        EDIT
      </button>
    </div>
  )
}

function IntegrationTab() {
  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="relative rounded-2xl border bg-white p-6">
        {/* Status badge */}
        <span className="absolute right-4 top-4 rounded-full bg-[#FBE7D6] px-3 py-1 text-xs font-medium text-[#D07C3E]">
          NOT CONNECTED
        </span>

        {/* Content */}
        <div className="flex flex-col items-center gap-6">
          <img
            src="/ZoomIcon.svg"
            alt="zoom-icon"
            className="h-24 w-24"
          />

          <Button className="rounded-lg bg-[#6962AC] py-2 text-white hover:bg-[#5A539C] transition-colors">
            Connect Your Account
          </Button>
        </div>
      </div>

    </div>
  )
}

function ActivityTab() {
  return (
    <div className="bg-white border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <ActivityTabCard key={i} />
      ))}
    </div>
  )
}

function ActivityTabCard() {
  return (
    <div className="border rounded-xl p-5 flex justify-between items-center">
      <div className="flex gap-4 items-center ">
        <div className="rounded-full bg-[#F7F7FF] h-20 w-20 flex items-center justify-center">
          <img src="/Laptop.svg" alt="device-icon" className="h-12 w-12" />
        </div>
        <div>
          <p className="font-semibold text-lg mb-1">Mac OS - Mumbai</p>
          <p className="text-sm text-gray-500">
            Bandra, Mumbai, India (106.51.81.253)
          </p>
        </div>
      </div>
      <img src="/SignOut.svg" alt="device-icon" />

    </div>
  )
}





function AcknowledgementTab() {
  return (
    <div className="bg-white border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <AgreementCard key={i} />
      ))}
    </div>
  )
}

function AgreementCard() {
  return (
    <div className="border rounded-xl p-5 flex justify-between items-center">
      <div>
        <p className="font-semibold text-lg mb-1">Agreement</p>
        <p className="text-sm text-gray-500">
          IIT Patna – Product Management and Agentic AI – IITPPM-2504
        </p>
      </div>

      <Button className="px-5 py-2 rounded-lg bg-indigo-50 text-[#6962AC] font-semibold hover:bg-[#5A539C] transition-colors">
        View
      </Button>
    </div>
  )
}

