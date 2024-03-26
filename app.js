const express=require("express");
const {open}=require("sqlite");
const sqlite3=require("sqlite3");
const app=express();
const path=require("path");
const dbPath=path.join(__dirname,"cricketMatchDetails.db");
app.use(express.json());

let db=null;

const initializeDBAndServer=async()=>{
    try{
        await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        app.listen(3000,()=>{
            console.log("Server running at http://localhost:3000");
        })
    }
    catch(e){
        console.log("DB Error is ${e.message}");
    }
}
initializeDBAndServer();

const convertPlayerDBAPI=(objectItem)=>{
    return{
        playerId:objectItem.player_id,
        playerName:objectItem.player_name
    }
}

app.get("/players/",async(request,response)=>{
    const getAllPlayersQuery=`
       SELECT * FROM player_details;
    `;
    const getAllPlayesrsRes=await db.all(getAllPlayersQuery);
    response.send(getAllPlayesrsRes.map((eachPlayer)=>convertPlayerDBAPI(eachPlayer)));
})

app.get("/players/:playerId",async(request,response)=>{
    const {playerId}=request.params;
    const getPlayerQuery=`
       SELECT * FROM player_details WHERE player_id=${playerId};`;
    const player=await db.get(getPlayerQuery);
    response.send(convertPlayerDBAPI(player));
})

app.put("/players/:playerId",async(request,response)=>{
    const {playerId}=request.params;
    const {playerName}=request.body;
    const updatedPlayerQuery=`
       UPDATE player_details SET
       player_name='${playerName}'
       WHERE player_id=${player_id};
    `;
    const updatedPlayerRes=await db.run(updatedPlayerQuery);
    response.send("Player Details Updated");
})

const convertMatchDBAPI=(objectItem)=>{
    return {
        matchId:objectItem.match_id,
        match:objectItem.match,
        year:objectItem.year
    }
}

app.get("/matches/:matchId/",async(request,response)=>{
    const {matchId}=request.params;
    const getMatchDetailsQuery=`
       SELECT * FROM match_details WHERE match_id=${matchId};
    `;
    const getMatchDetailsRes=await db.get(getMatchDetailsQuery);
    response.send(convertMatchDBAPI(getMatchDetailsRes));
})

app.get("/players/:playerId/matches/",async(request,response)=>{
    const {playerId}=request.params;
    const getAllMatchesQuery=`
       SELECT * FROM player_match_score
       WHERE player_id=${playerId};
    `
    const getAllMatchesRes=await db.all(getAllMatchesQuery);
    const matchesIdArr=getAllMatchesRes.map((eachMach)=>{
        return eachMach.match_id;
    });
    const getMatchesDetailsQuery=`
        SELECT * FROM match_details
        WHERE match_id in(${matchesIdArr});
    `;
    const fetchMatchDetailsRes=await db.all(getMatchesDetailsQuery);
    response.send(fetchMatchDetailsRes.map((eachMatch)=>convertMatchDBAPI(eachMatch)));
})

app.get("/matches/:matchId/players/",async(request,response)=>{
    const {match_id}=request.params;
    const getPlayersOfMatchQuery=`
       SELCET * FROM player_match_score 
       NATURAL JOIN player_details 
       WHERE match_id=${matchId};
    `
    const getPlayersOfMatchRes=await db.all(getPlayersOfMatchQuery);
    response.send(getPlayersOfMatchRes.map((eachPlayer)=>convertPlayerDBAPI(eachPlayer)));
})

const convertplayerStatsObject=(objectItem)=>{
    return{
        playerId:objectItem.player_id,
        playerName:objectItem.player_name,
        totalScore:objectItem.total_Score,
        totalFours:objectItem.total_fours,
        totalSixes:objectItem.total_sixes
    }
}

app.get("/players/:playerId/playerScores",async(request,response)=>{
    const {playerId}=request.params;
    const getPlayerNameQuery=`
       SELECT player_name FROM player_details
       WHERE player_id=${playerId}`;
    const getPlayerNameRes=await db.get(getPlayerNameQuery);
    const getPlayerStatisticsQuery=`
       SELECT player_id,
       sum(score) as totalScore,
       sum(fours) as totalFours,
       sum(sixes) as totalSixex
       FROM player_match_score 
       WHERE player_id=${playerId};
    `;
    const getPlayerStatisticsRes=await db.get(getPlayerStatisticsQuery);
    response.send(convertplayerStatsObject(getPlayerNameRes.player_name,getPlayerStatisticsRes))
})

module.exports=app;
