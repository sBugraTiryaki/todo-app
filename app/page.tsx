import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidatePath } from "next/cache";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  async function addTodo(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    if (!title?.trim()) return;

    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.todo.create({
      data: {
        title: title.trim(),
        userId: session.user.id,
      },
    });
    revalidatePath("/");
  }

  async function toggleTodo(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const completed = formData.get("completed") === "true";

    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.todo.updateMany({
      where: { id, userId: session.user.id },
      data: { completed: !completed },
    });
    revalidatePath("/");
  }

  async function deleteTodo(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;

    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.todo.deleteMany({
      where: { id, userId: session.user.id },
    });
    revalidatePath("/");
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          Welcome, {session.user?.name || session.user?.email}
        </h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            Logout
          </Button>
        </form>
      </div>

      <form action={addTodo} className="flex gap-2 mb-6">
        <Input
          name="title"
          placeholder="Add a new todo..."
          className="flex-1"
        />
        <Button type="submit">Add</Button>
      </form>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 p-3 border rounded-lg"
          >
            <form action={toggleTodo} className="flex items-center">
              <input type="hidden" name="id" value={todo.id} />
              <input
                type="hidden"
                name="completed"
                value={todo.completed.toString()}
              />
              <button
                type="submit"
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  todo.completed
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-input"
                }`}
              >
                {todo.completed && (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </form>
            <span
              className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}
            >
              {todo.title}
            </span>
            <form action={deleteTodo}>
              <input type="hidden" name="id" value={todo.id} />
              <Button type="submit" variant="ghost" size="sm">
                Delete
              </Button>
            </form>
          </li>
        ))}
        {todos.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No todos yet. Add one above!
          </p>
        )}
      </ul>
    </div>
  );
}
