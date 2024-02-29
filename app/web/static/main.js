const params = new URLSearchParams(location.search);
const io = new WebSocket(`${location.origin.replace("http", "ws")}/`);
let heartbeat_interval;

io.addEventListener("open", () => {
  heartbeat_interval = setInterval(() => {
    io.send(
      JSON.stringify({
        t: "heartbeat",
        d: "ping",
      })
    );
  }, 5000);
  io.send(
    JSON.stringify({
      t: "join",
      d: {
        code: params.get("code"),
      },
    })
  );
});

io.addEventListener("error", () => {
  clearInterval(heartbeat_interval);
});
io.addEventListener("close", () => {
  clearInterval(heartbeat_interval);
});

let room = {};
let isReadyToPlay = false;
let myPlayerId;

function checkWin(board) {
  if (!board) return null;
  // Check rows
  for (let i = 0; i < 9; i += 3) {
    if (board[i] && board[i + 1] && board[i + 2]) {
      return [i, i + 1, i + 2];
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (board[i] && board[i + 3] && board[i + 6]) {
      return [i, i + 3, i + 6];
    }
  }

  // Check diagonals
  if (board[0] && board[4] && board[8]) {
    return [0, 4, 8];
  }
  if (board[2] && board[4] && board[6]) {
    return [2, 4, 6];
  }

  return null;
}

const grids = [];
leave_btn.hidden = true;

io.addEventListener("message", (message) => {
  try {
    const data = JSON.parse(message.data);
    console.log(`${data["t"]} > ${data["d"]}`);
    switch (data["t"]) {
      case "force_end":
        Swal.fire({
          title: "เสมอ!",
          text: "เนื่องจากมีผู้เล่นออกจากห้อง เกมนี้จึงเสมอ",
          icon: "info",
        }).then(() => {
          location.replace("/");
        });
        break;
      case "hello":
        myPlayerId = data["d"]["player_id"];
        break;
      case "ready":
        room = data["d"];
        room_id_parent.hidden = true;
        share_btn.hidden = true;
        btn_group.hidden = true;
        isReadyToPlay = true;

        for (let index = 0; index < 9; index++) {
          const elem = document.createElement("button");
          elem.setAttribute("data-idx", index);
          elem.classList.add(
            ..."bg-white/30 backdrop-blur-sm font-bold aspect-square text-gray-800 text-lg md:text-xl flex justify-center items-center".split(
              " "
            )
          );
          elem.addEventListener("click", () => {
            select(index);
          });
          grid.append(elem);
          grids.push(elem);
        }
        break;
      case "win":
      case "draw":
        const winGrid = checkWin(
          [room["player1"], room["player2"]].find(({ id }) => id === data["d"])
            ?.grid
        );
        btn_group.hidden = false;
        leave_btn.hidden = false;
        if (!winGrid) {
          Swal.fire({
            title: "Draw",
            text: "Y'all good",
          });
          return;
        }
        grids.forEach((elem, idx) => {
          elem.disabled = true;
          const findIdx = winGrid.find((_) => _ == idx);
          if (findIdx >= 0) {
            elem.classList.add(
              "scale-105",
              "shadow-xl",
              `${findIdx % 2 == 0 ? "" : "-"}rotate-6`,
              "z-50"
            );
          } else {
            elem.classList.add("opacity-25");
          }
        });
        confetti({
          spread: 360,
          ticks: 100,
          gravity: 0,
          decay: 0.94,
          startVelocity: 30,
          particleCount: 100,
          scalar: 2,
          ...(data["d"] != myPlayerId
            ? {
                shapes: ["emoji"],
                shapeOptions: {
                  emoji: {
                    value: ["🥲", "😫", "😶‍🌫️", "🤧"],
                  },
                },
              }
            : {}),
        });
        switch (data["d"]) {
          case room["player1"]["id"]:
            player2_side.classList.remove("bg-red-600");
            player2_side.classList.add("bg-red-950");

            player2_side.classList.remove("scale-125");
            player1_side.classList.remove("scale-125");
            player1_side.classList.add("scale-150");
            player1_state.classList.add("animate-bounce");
            break;
          case room["player2"]["id"]:
            player1_side.classList.remove("bg-blue-600");
            player1_side.classList.add("bg-blue-950");

            player1_side.classList.remove("scale-125");
            player2_side.classList.remove("scale-125");
            player2_side.classList.add("scale-150");
            player2_state.classList.add("animate-bounce");
            break;
          default:
            break;
        }
      case "update":
        if (data["d"] === false) {
          Swal.fire({
            title: "ไม่พบห้องนี้ / ห้องเต็มแล้ว",
          }).then(() => location.replace("/"));
          return;
        }
        waiting_overlay.hidden = true;
        room = data["d"];
        player1_txt.textContent = `${
          room["player1"]["id"] == myPlayerId ? "(YOU) " : ""
        }${room["player1"]["id"] || "None"}`;
        player1_state.textContent = "X";
        player2_txt.textContent = `${
          room["player2"]["id"] == myPlayerId ? "(YOU) " : ""
        }${room["player2"]["id"] || "None"}`;
        player2_state.textContent = "O";

        room_id.textContent = room["id"];

        if (!room["turn"]) {
          player1_side.classList.add("scale-125");
          player2_side.classList.remove("scale-125");
        } else {
          player2_side.classList.add("scale-125");
          player1_side.classList.remove("scale-125");
        }

        for (let index = 0; index < 9; index++) {
          const elem = document.querySelector(`button[data-idx=\"${index}\"]`);
          if (elem.classList.contains("bg-white")) continue;
          if (data["d"]["player1"]["grid"][index]) {
            elem.classList.remove("bg-white/30");
            elem.classList.add("bg-white");
            elem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
          </svg>`;
            elem.disabled = true;
          } else if (data["d"]["player2"]["grid"][index]) {
            elem.classList.remove("bg-white/30");
            elem.classList.add("bg-white");
            elem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          </svg>`;
            elem.disabled = true;
          } else {
            if (
              (room["turn"] && room["player1"]["id"] === myPlayerId) ||
              (!room["turn"] && room["player2"]["id"] === myPlayerId)
            ) {
              // is not my turn
              elem.disabled = true;
            } else {
              elem.disabled = false;
            }
          }
        }

        break;
      default:
        break;
    }
  } catch (error) {
    console.log(error);
  }
});

const select = (idx) => {
  if (!isReadyToPlay) return;
  idx = parseInt(idx);
  if (idx < 0 || idx > 8) return alert("kuy");
  io.send(
    JSON.stringify({
      t: "select",
      d: idx,
    })
  );
};