import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { LabelInputContainer } from "../ui/misc";
import AceButton from "../ui/AceButton";
import { useMutation } from "@tanstack/react-query";
import { createRoomAction } from "../../lib/actions/roomAction";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateRoomSchema } from "../../lib/schemas/room.schema";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

function CreateRoomForm() {
  const genRoomId = () => {
    setValue("roomId", crypto.randomUUID(), { shouldValidate: true });
  };
  const nav = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: createRoomAction,
    onSuccess: (res) => {
      if (res) nav(`/room/${res.data}`);
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const {
    handleSubmit,
    setValue,
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateRoomSchema),
    defaultValues: {
      title: "",
      password: "",
      roomId: "",
    },
  });

  const onSubmit = (data: z.infer<typeof CreateRoomSchema>) => {
    mutate(data);
  };

  return (
    <div className="absolute max-lg:top-[55%] top-1/2 -translate-y-1/4 inset-x-0 z-50 max-w-md w-full mx-auto rounded-xl border border-neutral-900 md:rounded-2xl p-4 md:p-8 bg-white dark:bg-[rgba(0,0,0,0.5)] shadow-input">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Create A Room
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300 flex items-center gap-2">
        Start by putting your name in.
      </p>
      <form className="mt-8 mb-4 max-md:mb-4" onSubmit={handleSubmit(onSubmit)}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="roomId">Room ID</Label>
          <Input
            id="roomId"
            {...register("roomId")}
            placeholder="Custom room id"
            type="text"
            transparent={true}
          />
          <small className="text-white">
            Generate a RoomId,{" "}
            <button
              type="button"
              className="text-purple-400"
              onClick={genRoomId}
            >
              Click here
            </button>
          </small>
          {errors.roomId && (
            <span className="text-sm text-red-500">
              {errors.roomId.message}
            </span>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="title">Title</Label>
          <Input
            {...register("title")}
            id="title"
            placeholder="eg: Collabrite"
            type="text"
            transparent={true}
          />
          {errors.title && (
            <span className="text-sm text-red-500">{errors.title.message}</span>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            {...register("password")}
            placeholder="••••••••"
            type="password"
            transparent={true}
          />
          {errors.password && (
            <span className="text-sm text-red-500">
              {errors.password.message}
            </span>
          )}
        </LabelInputContainer>

        <AceButton isLoading={isPending} type="submit">
          Create Room
        </AceButton>
      </form>
    </div>
  );
}

export default CreateRoomForm;
