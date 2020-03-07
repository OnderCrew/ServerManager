const path = require('path').resolve()
const { writeFileSync } = require('fs')
const { Client, MessageEmbed } = require('discord.js')
const settings = require('./data/settings.json')
const warnings = require('./data/warnings.json')
const locales = require('./data/locales.json')

let targetGuild
const bot = new Client()
bot.login(settings.basic.token)

bot.on('ready', () => {
  console.log(locales.readyMessage)
  targetGuild = bot.guilds.resolve(settings.guild)
  bot.user.setActivity(locales.activity.replace('%usercount', targetGuild.memberCount), { type: 'WATCHING' })
  targetGuild.members.cache.forEach((member) => {
    if (!Object.keys(warnings).includes(member.id)) warnings[member.id] = 0
    if (warnings[member.id] === 3) {
      member.kick().then(() => {
        const embed = new MessageEmbed()
          .setTitle(locales.kickTitle.replace('%username', member.user.username))
          .addField(locales.kickReason, locales.kickByManyWarning)
          .setColor(0xff0000)
        targetGuild.channels.resolve(settings.channels.warning).send(embed)
      }).catch(() => {
        const embed = new MessageEmbed()
          .setTitle(locales.kickTitleFail.replace('%username', member.user.username))
          .addField(locales.kickReason, locales.kickByManyWarning)
          .setColor(0xFEFC42)
        targetGuild.channels.resolve(settings.channels.warning).send(embed)
      })
    }
  })
})

bot.on('message', (msg) => {
  if (!msg.content.startsWith(locales.prefix) || msg.author.bot) return
  const targetCmd = msg.content.split(locales.prefixLast)[1].split(locales.argSplitor)[0]
  const argument = msg.content.split(locales.argSplitor).slice(1)

  switch (targetCmd) {
    case locales.warningCommand: {
      if (!msg.member.roles.cache.get(settings.roles.canWarn)) {
        const embed = new MessageEmbed()
          .setColor(0xff0000)
          .setTitle(locales.warningCommandPermissionFail)
          .setDescription(locales.warningCommandPermissionFailDescription.replace('%rolemention', '<@&' + settings.roles.canWarn + '>'))

        msg.channel.send(embed)
          .then((m) => {
            if (msg.deletable) msg.delete({ timeout: 5000 })
            m.delete({ timeout: 5000 })
          })
      } else if (argument.length < 1) {
        const embed = new MessageEmbed()
          .setTitle(locales.warningCommandArgumentsFail)
          .addField(locales.warningCommandHelp, locales.warningCommandHelpContent)
          .setColor(0xff0000)

        msg.channel.send(embed)
          .then((m) => {
            if (msg.deletable) msg.delete({ timeout: 5000 })
            m.delete({ timeout: 5000 })
          })
      } else {
        let target = msg.mentions.users.first()
        if (!target) target = targetGuild.member(argument[0])
        if (!target) {
          const embed = new MessageEmbed()
            .setTitle(locales.warningCommandInvaildMember.replace('%username', argument[0]))
            .setDescription(locales.warningCommandInvaildMemberDescrption)
            .setColor(0xff0000)

          msg.channel.send(embed)
            .then((m) => {
              if (msg.deletable) msg.delete({ timeout: 5000 })
              m.delete({ timeout: 5000 })
            })
        } else {
          warnings[target.id]++
          const embed = new MessageEmbed()
            .setTitle(locales.warningTitle.replace('%username', target.username))
            .addField(locales.warningLocation, '<#' + msg.channel.id + '>')
            .setColor(0xFF6F53)
            .setTimestamp()
            .setFooter(targetGuild.name)

          if (argument[1]) embed.addField(locales.warningReason, argument[1])

          targetGuild.channels.resolve(settings.channels.warning)
            .send({ content: '<@' + target.id + '>', embed: embed.toJSON() })
          target.send(embed).catch(fnull)

          const successEmbed = new MessageEmbed()
            .setColor(0x00ff00)
            .setTitle(locales.warningCommandSuccess)
          msg.channel.send(successEmbed)
            .then((m) => {
              if (msg.deletable) msg.delete({ timeout: 5000 })
              m.delete({ timeout: 5000 })
            })
        }
      }
    }
  }
})

setInterval(() => writeFileSync(path + '/data/warnings.json', JSON.stringify(warnings)), 10000)
function fnull () {} // Functioned Null
