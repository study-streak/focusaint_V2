import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Navbar from "../dashboard/components/core/Navbar"
import AmbientBackground from "../dashboard/components/ui-effects/AmbientBackground"

export default async function GoalsLayout({ children }) {
    const cookieStore = await cookies()
    const token = cookieStore.get('focusaint_token')?.value

    if (!token || token === 'undefined' || token === 'null') {
        redirect("/auth/login?callbackUrl=/goals")
    }

    return (
        <div className="relative min-h-screen text-[var(--white)] bg-[var(--black)] overflow-hidden transition-colors duration-300">
            <AmbientBackground />
            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="px-6 pt-6">
                    <Navbar />
                </div>
                {children}
            </div>
        </div>
    )
}
