import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../services/contants";
import { useParams } from "react-router-dom";

export default function IsVerify() {
  const [isVerified, setIsverified] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [browserId, setBrowserId] = useState("");

  let params = useParams();
  useEffect(() => {
    if (params && params.Id) {
      Isverifyfun();
    }
  }, [params]);

  const Isverifyfun = async () => {
    const data = await axios.put(apiUrl + "/user/updatebyadmin", {
      token: params.Id,
      isAuthentify: true,
    });
    if (data.data.success === true) {
      setIsverified(true);
      setUserEmail(data.data.response.email);
      setBrowserId(data.data.response.browserId);
    }
  };

  return (
    <>
      <div className={isVerified === true ? "verifydiv" : "verifydivred"}>
        <div
          className={isVerified === true ? "miniverifydiv" : "miniverifydivred"}
        >
          <img
            src={
              isVerified === true
                ? "/assets/verified.png"
                : "/assets/notverify.png"
            }
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
            className={isVerified === true ? "wordblue" : "wordred"}
          >
            <div>Email : {userEmail}</div>
            <div>BrowserId : {browserId}</div>
            <div>Verfied</div>
          </div>
        </div>
      </div>
    </>
  );
}
