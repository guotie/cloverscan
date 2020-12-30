import { Producer } from 'kafkajs'
import kafka from './broker'

// 推送数据到kafka
const producer: Producer = kafka.producer()

async function pushKafka(topic: string, data: any) {
    await producer.connect()
    
    await producer.send({
        topic: topic,
        messages: [{value: data}] // todo 是否需要 stringify
    })
}

async function pushBatch(topic: string, data: Array<any>) {
    let msg = []

    for (let i = 0; i < data.length; i ++) {
        let v = JSON.stringify(data[i])

        msg.push({
            topic: topic,
            messages: [{
                value: v
            }]
        })
    }
    await producer.connect()
    
    await producer.sendBatch({
        topicMessages: msg // todo 是否需要 stringify
    })
}

export {
    pushKafka,
    pushBatch,
}
