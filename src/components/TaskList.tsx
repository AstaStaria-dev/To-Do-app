import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  deadline: string | null;
  created_at: string;
}

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: () => void;
}

export default function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (task: Task) => {
    setUpdating(task.id);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", task.id);

      if (error) throw error;
      onTaskUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      onTaskUpdate();
      toast({
        title: "Task deleted",
        description: "Task has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && !tasks.find((t) => t.deadline === deadline)?.completed;
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className={`p-4 transition-opacity ${updating === task.id ? "opacity-50" : ""} ${
            task.completed ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => handleToggle(task)}
              disabled={updating === task.id}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium ${
                  task.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {task.deadline && (
                  <div
                    className={`flex items-center gap-1 ${
                      isOverdue(task.deadline) ? "text-destructive" : ""
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(task.deadline), "PPp")}</span>
                  </div>
                )}
                <span>Created {format(new Date(task.created_at), "PP")}</span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleDelete(task.id)}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tasks yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
