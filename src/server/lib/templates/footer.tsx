import React from "react";
import theme from "src/styles/theme";

interface FooterProps {
  orgName: string;
  settingsUrl: string;
}

const styles = {
  small: {
    marginTop: 12,
    fontSize: "0.8em",
    color: theme.colors.gray
  }
};

const Footer: React.FC<FooterProps> = ({ orgName, settingsUrl }) => {
  return (
    <>
      - <a href="https://www.politicsrewired.com/">Politics Rewired</a> Team
      <div style={styles.small}>
        You are receiving this email because you signed up to text for {orgName}
        .
        <br />
        <a href={settingsUrl}>Update</a> your preferences or unsubscribe{" "}
        <a href={settingsUrl}>here</a>
        .
        <br />
      </div>
    </>
  );
};
export default Footer;
