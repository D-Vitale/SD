const express = require("express")
const app = express()
const fetch = require("node-fetch")
const { response } = require("express")

const menuItems = {
    "home" : {
        name : "home",
        link : "/",
        teams : undefined,
        logo : undefined,
    },
    "SA" : {
        name : "Serie A",
        link : "/SA",
        teams : 20,
        logo : "/images/seriea.png",
    },
    "PL" : {
        name : "Premier League",
        link : "/PL",
        teams : 20,
        logo : "/images/premier.png",
    },
    "BL1" : {
        name : "Bundesliga 1",
        link : "/BL1",
        teams : 18,
        logo : "/images/bundesliga.png",
    },
    "PPL" : {
        name : "Primeira Liga",
        link : "/PPL",
        teams : 18,
        logo : "/images/primeiraliga.png",
    },
    "DED" : {
        name : "Eredivisie",
        link : "/DED",
        teams : 18,
        logo : "/images/eredivisie.png",
    },
    "FL1" : {
        name : "Ligue 1",
        link : "/FL1",
        teams : 20,
        logo : "/images/ligue1.png",
    },
    "PD" : {
        name : "La Liga",
        link : "/PD",
        teams : 20,
        logo : "/images/laliga.png",
    },
    "ELC" : {
        name : "Championship",
        link : "/ELC",
        teams : 24,
        logo : "/images/championship.png",
    }
}

async function callTablesApi(teams, points, gameplayed, won, draw, lost, goalsfor, goalsagainst, goalsdiff, code){
    await fetch(`https://api.football-data.org/v2/competitions/${code}/standings?season=2019`, {
        headers: {
            "X-Auth-Token" : "058411f022f3449bbe8fcfba93667523"
        }
    })
      .then(function(response){return response.json()})
      .then(function(data){
        const standings = data["standings"]
        const table = standings[0]["table"]
        table.forEach(element => {
            teams.push(element["team"]["name"])
            points.push(element["points"])
            gameplayed.push(element["playedGames"])
            won.push(element["won"])
            draw.push(element["draw"])
            lost.push(element["lost"])
            goalsfor.push(element["goalsFor"])
            goalsagainst.push(element["goalsAgainst"])
            goalsdiff.push(element["goalDifference"])
        })
        return teams, points, gameplayed, won, draw, lost, goalsfor, goalsagainst, goalsdiff
      })
    return teams, points, gameplayed, won, draw, lost, goalsfor, goalsagainst, goalsdiff
}

async function getTable(res, code, competition, logo){
    let teams = []
    let points = []
    let gameplayed = []
    let won = []
    let draw = []
    let lost = []
    let goalsfor = []
    let goalsagainst = []
    let goalsdiff = []
    await callTablesApi(teams, points, gameplayed, won, draw, lost, goalsfor, goalsagainst, goalsdiff, code)
    res.render("table.ejs", {
        teams : teams, 
        points : points, 
        gameplayed : gameplayed,
        won : won,
        draw : draw,
        lost : lost,
        goalsfor : goalsfor,
        goalsagainst : goalsagainst,
        goalsdiff : goalsdiff,
        code : code,
        competition : competition,
        logo : logo
    })
}

async function callGoalsApi(code, playersnames, playersteams, playersgoals){
    await fetch(`https://api.football-data.org/v2/competitions/${code}/scorers?limit=20&season=2019`, {
        headers: {
            "X-Auth-Token" : "058411f022f3449bbe8fcfba93667523"
        }
    })
      .then(function(response){return response.json()})
      .then(function(data){
          let scorers = data["scorers"]
          scorers.forEach(element => {
              playersnames.push(element["player"]["name"])
              playersteams.push(element["team"]["name"])
              playersgoals.push(element["numberOfGoals"])
          })
        return playersnames, playersteams, playersgoals
      })
    return playersnames, playersteams, playersgoals
}

async function getGoalsTable(res, code, competition){
    let playersnames = []
    let playersteams = []
    let playersgoals = []
    await(callGoalsApi(code, playersnames, playersteams, playersgoals))
    res.render("tablestats.ejs",{
        playersnames : playersnames,
        playersteams : playersteams,
        playersgoals : playersgoals,
        competition : competition,
        code : code
    })
}

async function callMatchesApi(code, matchday, hometeams, awayteams, scores){
    await fetch(`https://api.football-data.org/v2/competitions/${code}/matches?matchday=${matchday}&season=2019`, {
        headers : {
            "X-Auth-Token" : "058411f022f3449bbe8fcfba93667523"
        }
    })
    .then(function(response){return response.json()})
    .then(function(data){
        const matches = data["matches"]
        matches.forEach(element => {
            hometeams.push(element["homeTeam"]["name"])
            awayteams.push(element["awayTeam"]["name"])
            scores.push(`${element["score"]["fullTime"]["homeTeam"]} - ${element["score"]["fullTime"]["awayTeam"]}`)
        });
        return hometeams, awayteams, scores
    })
    return hometeams, awayteams, scores
}

async function getMatchdayTable(res, code, competition, matchday){
    let hometeams = []
    let awayteams = []
    let scores = []
    await(callMatchesApi(code, matchday, hometeams, awayteams, scores))
    res.render("matchday.ejs",{
        hometeams : hometeams,
        awayteams : awayteams,
        scores : scores,
        competition : competition,
        code : code,
        matchday : matchday
    })
}

app.set("view engine", "ejs")

app.use(express.static(__dirname + '/public'))

app.get("/", function(req, res){
    res.render("home.ejs")
})

app.get("/:code", function(req, res){
    getTable(res, req.params.code, menuItems[req.params.code].name, menuItems[req.params.code].logo)
})

app.get("/:code/stats", function(req, res){
    getGoalsTable(res, req.params.code, menuItems[req.params.code].name)
})

app.get("/:code/matches", function(req, res){
    res.render("matches.ejs", {
        code : req.params.code, 
        teams : menuItems[req.params.code].teams,
        competition : menuItems[req.params.code].name
    })
})

app.get("/:code/matches/:matchday", function(req, res){
    getMatchdayTable(res, req.params.code, menuItems[req.params.code].name, req.params.matchday)
})

app.listen(8080, function(req, res){
    console.log("server avviato sulla porta 8080")
})