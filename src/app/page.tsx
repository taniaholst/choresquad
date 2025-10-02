import Link from "next/link"

export default function Home() {
    return (
        <main className="mx-auto max-w-3xl p-6 space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">ChoreSquad</h1>
                <Link href="/households" className="underline">Go to Households</Link>
            </header>
            <p className="text-sm opacity-80">
                Create a household, invite people, add chores, assign folks, and track recurring tasks.
            </p>
        </main>
    )
}