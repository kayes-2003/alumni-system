import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++",
  "Go", "Rust", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes",
  "Machine Learning", "Data Science", "Product Management", "UI/UX Design",
  "Marketing", "Finance", "Accounting", "Business Strategy", "Leadership",
];

interface SkillsEditorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
}

export function SkillsEditor({ skills, onChange, maxSkills = 20 }: SkillsEditorProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = input.length > 0
    ? SUGGESTIONS.filter(
        (s) =>
          s.toLowerCase().includes(input.toLowerCase()) &&
          !skills.includes(s)
      ).slice(0, 6)
    : [];

  const add = (skill: string) => {
    const s = skill.trim();
    if (!s || skills.includes(s) || skills.length >= maxSkills) return;
    onChange([...skills, s]);
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const remove = (skill: string) => onChange(skills.filter((s) => s !== skill));

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            placeholder={skills.length >= maxSkills ? `Max ${maxSkills} skills reached` : "Add a skill…"}
            disabled={skills.length >= maxSkills}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); add(input); }
              if (e.key === "Escape") setShowSuggestions(false);
            }}
          />
          <button
            type="button"
            onClick={() => add(input)}
            disabled={!input.trim() || skills.length >= maxSkills}
            className="flex items-center justify-center h-10 w-10 rounded-md border bg-background hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-20 top-11 left-0 right-12 rounded-md border bg-popover shadow-md overflow-hidden">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => add(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skill tags */}
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1 pr-1 text-sm py-1">
              {skill}
              <button
                type="button"
                onClick={() => remove(skill)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No skills added yet. Start typing to add some.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {skills.length}/{maxSkills} skills
      </p>
    </div>
  );
}