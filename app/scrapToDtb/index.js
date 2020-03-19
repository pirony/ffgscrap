module.exports = {

  async saveOrUpdateDatas (models, scores) {
    console.log(typeof scores)
    console.log(scores)
    return
    // let course = await this.saveCompetitionCourse (models, scores[0])
    // let postedCompetition = await this.saveCompetition(models, scores[0], {trnID, course})
    // if (!postedCompetition) return
    // for (let score of scores) {
    //   let playerClub = course
    //   if (score.glf_lic !== playerClub.course_num) {
    //     playerClub = await this.savePlayerClub (models, score)
    //   }
    //   let player = await this.savePlayer (models, score, {playerClub})
    //   let serie = await this.saveSerie (models, score)
    //   let scorecard = await this.saveScorecard (models, score, {competition: postedCompetition, player, course, serie})
    // }
  },

  async saveCompetitionCourse ({courses}, card) {
    const exists = await courses.findOne({course_num: card.glf_org})
    if (exists && exists.course_num) {
      return exists
    }
    try {
      let course = new courses({
        course_title: card.glf_lib_cou,
        course_num: card.glf_org,
        course_par: card.pars
      })
      let posted = await course.save()
      return posted
    } catch (err) {
      console.log('err' , err)
      return
    }
  },

  async savePlayerClub ({courses}, card) {
    const exists = await courses.findOne({course_num: card.glf_lic})
    if (exists && exists.course_num) {
      return exists
    }
    try {
      let course = new courses({
        course_title: card.club,
        course_num: card.glf_lic
      })
      let posted = await course.save()
      return posted
    } catch (err) {
      console.log('err' , err)
      return
    }
  },

  async saveCompetition ({competitions}, card, {trnID, course}) {
    const exists = await competitions.findOne({ffg_cpt_id: trnID})
    console.log(exists);
    if (exists && exists.cpt_course) {
      return
    }
    try {
      let trn = new competitions({
        cpt_id:  trnID,
        cpt_title: card.lib_cpt,
        cpt_type: card.lib_typ_cpt,
        cpt_date: card.dte_cpt.split('/').reverse().join(''),
        cpt_form: card.lib_for,
        cpt_course: course._id
      })
      let posted = await trn.save()
      return posted
    } catch (e) {
      console.log('err' + err)
      return
    }
  },

  async savePlayer ({players}, card, {playerClub}) {
    const exists = await players.findOne({licence_id: card.lic_num})
    if (exists && exists.licence_id) {
      return exists
    }
    const toPost = {
      licence_id: card.lic_num,
      first_name: card.pre_jou,
      last_name: card.nom_jou,
      display_name: card.joueur,
      player_club: playerClub._id // COMBAK: NEED objectId mongo
    }
    try {
      let player = new players(toPost)
      let posted = await player.save()
      return posted
    } catch (e) {
      console.log('err' + err)
      return
    }
  },

  async saveSerie ({series}, card) {
    const exists = await series.findOne({ser_title: card.serie})
    if (exists && exists.ser_num) {
      return exists
    }
    try {
      let serie = new series({
        ser_title: card.serie,
        ser_num: card.num_ser,
        ser_type: card.type_ser
      })
      let posted = await serie.save()
      return posted
    } catch (e) {
      console.log('err' + err)
      return
    }
  },

  async saveScorecard ({scoreCards}, card, {competition, player, course, serie}) {
    const exists = await scoreCards.findOne({scr_cpt_id: new ObjectId(competition._id), scr_player: new ObjectId(player._id)})
    if (exists && exists.scr_player) {
      return exists
    }
    const toPost = {
      scr_cpt_name: card.lib_cpt,
      scr_cpt_id: competition._id,
      scr_ter_par: card.pars,
      scr_cpt_form: card.lib_for,
      scr_cpt_date: competition.cpt_date,
      scr_serie: serie._id,
      scr_player: player._id,
      scr_cpt_course: course._id,
      scr_player_index: card.index
    }
    for (var i = 1; i < 5 ; i++) {
      if (card['resultsT' + i]) {
        toPost['scr_t' + i] = card['resultsT' + i]
        toPost.scr_tours_count = i
      }
    }
    try {
      let scorecard = new scoreCards(toPost)
      let posted = await scorecard.save()
      return posted
    } catch (err) {
      console.log('err' , err)
      return
    }
  }

}
