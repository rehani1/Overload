import { Input } from "@/components/Input";

type ExerciseSearchProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function ExerciseSearch({ value, onChangeText }: ExerciseSearchProps) {
  return (
    <Input
      label="Search exercises"
      onChangeText={onChangeText}
      placeholder="Bench, squat, pull..."
      value={value}
    />
  );
}
