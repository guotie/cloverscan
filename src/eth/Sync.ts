import kafka from '../kafka/broker'
import { TopicEthAccount, TopicErcToken } from './Push'

import { KafkaMessage, EachMessagePayload } from 'kafkajs'

// 从kafka中读取消息, 更细用户余额

const consumer = kafka.consumer({ groupId: 'test-group' })

async function subscribeTopics(topics: string[], fromBeginning = false) {
  for (let i = 0; i < topics.length; i ++) {
    await consumer.subscribe({ topic: topics[i], fromBeginning: fromBeginning })
  }
}

async function handleMessage({topic, partition, message}: EachMessagePayload) {
  let val = JSON.parse(message.value?.toString() ?? '{}')
  console.log(topic, val)
}

async function main() {
  await consumer.connect()
  await subscribeTopics([TopicEthAccount, TopicErcToken])

  consumer.run({
    eachMessage: handleMessage,
  })
}

// await consumer.run({
//   eachMessage: async ({ topic, partition, message }) => {
//     console.log({
//       value: message.value.toString(),
//     })
//   },
// })
main()
