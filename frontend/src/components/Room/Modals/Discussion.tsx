import fallback_pp from "/assets/fallback_pp.jpg";

const Discussion = ({
  chat,
  userId,
}: {
  chat: IDiscussion | null;
  userId?: string;
}) => {
  return (
    <div className="flex flex-col flex-1">
      {chat &&
        chat.chat.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${!(userId === message?.sender?._id) ? "flex-row" : "flex-row-reverse"} items-center`}
          >
            <img
              src={message?.sender?.avatar?.secure_url ?? fallback_pp}
              alt={message?.sender?.username}
              className="h-7 w-7 rounded-full object-cover"
            />
            <div className="max-w-[80%] max-lg:max-w-[90%] my-1 bg-blue-500 text-white py-1 px-2 mx-2 rounded-md">
              <small className="text-blue-800 line-clamp-1 text-xs">
                {message?.sender?.username}
              </small>
              <p className="">{message?.message}</p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Discussion;
