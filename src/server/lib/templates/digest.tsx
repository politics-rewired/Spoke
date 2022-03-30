import React from "react";
import ReactDOMServer from "react-dom/server";

interface Notification {
  id: number;
  subject: string;
  content: string;
}

interface Props {
  notifications: Notification[];
}

const Digest: React.FC<Props> = ({ notifications }) => {
  return (
    <div>
      <p>Here's your periodic digest, with all the notifications for you!</p>
      {notifications.map((notification) => {
        return (
          <div key={notification.id}>
            <p style={{ fontWeight: "bold" }}>{notification.subject}</p>
            <br />
            <br />
            <p>{notification.content}</p>
          </div>
        );
      })}
    </div>
  );
};

const getDigest = (notifications: Notification[]) => {
  const template = <Digest notifications={notifications} />;
  return ReactDOMServer.renderToStaticMarkup(template);
};

export default getDigest;
