const path = require('path').resolve()
const { writeFileSync } = require('fs')
const { Client, MessageEmbed } = require('discord.js')
const settings = require('./data/settings.json')
const warnings = require('./data/warnings.json')
const locales = require('./data/locales.json')
const customs = require('./data/customs.json')

let targetGuild
const bot = new Client()
bot.login(settings.basic.token).then(fnull)

bot.on('ready', () => {
  console.log(locales.readyMessage)
  targetGuild = bot.guilds.resolve(settings.guild)
  bot.user.setActivity(locales.activity.replace('%usercount', targetGuild.memberCount), { type: 'WATCHING' }).then(fnull)
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
            if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
            m.delete({ timeout: 5000 }).then(fnull)
          })
      } else if (argument.length < 1) {
        const embed = new MessageEmbed()
          .setTitle(locales.warningCommandArgumentsFail)
          .addField(locales.warningCommandHelp, locales.warningCommandHelpContent)
          .setColor(0xff0000)

        msg.channel.send(embed)
          .then((m) => {
            if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
            m.delete({ timeout: 5000 }).then(fnull)
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
              if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
              m.delete({ timeout: 5000 }).then(fnull)
            })
        } else {
          warnings[target.id]++
          const embed = new MessageEmbed()
            .setTitle(locales.warningTitle.replace('%username', target.username))
            .addField(locales.warningLocation, '<#' + msg.channel.id + '>')
            .addField(locales.warningTotal.replace('%username', target.username), locales.warningTotalContent.replace('%count', warnings[target.id]))
            .setColor(0xFF6F53)
            .setTimestamp()
            .setFooter(targetGuild.name)

          if (argument[1]) embed.addField(locales.warningReason, argument.slice(1).join(' '))

          targetGuild.channels.resolve(settings.channels.warning)
            .send({ content: '<@' + target.id + '>', embed: embed.toJSON() })
          target.send(embed).catch(fnull)

          const successEmbed = new MessageEmbed()
            .setColor(0x00ff00)
            .setTitle(locales.warningCommandSuccess)
          msg.channel.send(successEmbed)
            .then((m) => {
              if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
              m.delete({ timeout: 5000 }).then(fnull)
            })
        }
      }
      break
    }

    case locales.reportCommand: {
      if (argument.length < 2) {
        const embed = new MessageEmbed()
          .setTitle(locales.reportCommandArgumentsFail)
          .addField(locales.reportCommandHelp, locales.reportCommandHelpContent)
          .setColor(0xff0000)

        msg.channel.send(embed)
          .then((m) => {
            if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
            m.delete({ timeout: 5000 }).then(fnull)
          })
      } else {
        let target = msg.mentions.users.first()
        if (!target) target = targetGuild.member(argument[0])
        if (!target) {
          const embed = new MessageEmbed()
            .setTitle(locales.reportCommandInvaildMember.replace('%username', argument[0]))
            .setDescription(locales.reportCommandInvaildMemberDescrption)
            .setColor(0xff0000)

          msg.channel.send(embed)
            .then((m) => {
              if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
              m.delete({ timeout: 5000 }).then(fnull)
            })
        } else {
          const embed = new MessageEmbed()
            .setColor(0xffffff)
            .setTitle(locales.reportTitle.replace('%username', target.username))
            .setDescription(argument.slice(1).join(' '))
            .setFooter(locales.reportFrom.replace('%channelname', msg.channel.name).replace('%username', msg.author.username))

          targetGuild.channels.resolve(settings.channels.report)
            .send({ content: '<@&' + settings.roles.reportNoti + '>', embed: embed.toJSON() })

          const successEmbed = new MessageEmbed()
            .setColor(0x00ff00)
            .setTitle(locales.reportCommandSuccess)
          msg.channel.send(successEmbed)
            .then((m) => {
              if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
              m.delete({ timeout: 5000 }).then(fnull)
            })
        }
      }
      break
    }

    case locales.supportCommand: {
      if (argument.length < 1) {
        const embed = new MessageEmbed()
          .setTitle(locales.supportCommandArgumentsFail)
          .addField(locales.supportCommandHelp, locales.supportCommandHelpContent)
          .setColor(0xff0000)

        msg.channel.send(embed)
          .then((m) => {
            if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
            m.delete({ timeout: 5000 }).then(fnull)
          })
      } else {
        targetGuild.channels.resolve(settings.channels.support)
          .send('<@&' + settings.roles.reportNoti + '>\n\n' +
            locales.supportContent.replace('%content', argument.join(' '))
              .replace('%usermention', '<@' + msg.author.id + '>'))

        const successEmbed = new MessageEmbed()
          .setColor(0x00ff00)
          .setTitle(locales.supportCommandSuccess)
        msg.channel.send(successEmbed)
          .then((m) => {
            if (msg.deletable) msg.delete({ timeout: 5000 }).then(fnull)
            m.delete({ timeout: 5000 }).then(fnull)
          })
      }
      break
    }

    default: {
      const query = customs.find((e) => e.input === targetCmd)
      if (query) {
        const result = query.output
          .replace('%username', msg.author.username)
          .replace('%userid', msg.author.id)
          .replace('%usermention', '<@' + msg.author.id + '>')
        msg.channel.send(result).then(fnull)
      }
    }
  }
})

setInterval(() => writeFileSync(path + '/data/warnings.json', JSON.stringify(warnings)), 10000)
function fnull () {} // Functioned Null
