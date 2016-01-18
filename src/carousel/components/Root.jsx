import React, { Component } from 'react';
import HTML5Backend         from 'react-dnd/modules/backends/HTML5';
import { DragDropContext }  from 'react-dnd';
import update               from 'react/lib/update';
import DemoFixtures         from './core/demo-fixtures';
import Carousel             from './Carousel';
import CarouselItem         from './CarouselItem';
import Card                 from './Card';


import './styles/dedreactcarousel.scss';

class Root extends Component {
  constructor(props){
    super(props);
    this.moveCard = this.moveCard.bind(this);
    this.state ={
      cursor: 0,
      items:DemoFixtures.items169,
      boxes: [
        { name: 'Content1', type: "ItemTypes.MANUAL_RULE" },
        { name: 'Content2', type: "ItemTypes.MANUAL_RULE" },
        { name: 'Content3', type: "ItemTypes.MANUAL_RULE" }
      ],
      dustbins: [
        { accepts: ["ItemTypes.MANUAL_RULE"], lastDroppedItem: null }
      ],
      droppedBoxNames: []
    };
  }

  moveCard(id, afterId) {
    const cards = this.state.items;

    const card = cards.filter(c => c.id === id)[0];
    const afterCard = cards.filter(c => c.id === afterId)[0];
    const cardIndex = cards.indexOf(card);
    const afterIndex = cards.indexOf(afterCard);

    this.setState(update(this.state, {
      items: {
        $splice: [
          [cardIndex, 1],
          [afterIndex, 0, card]
        ]
      }
    }));
  }

  isDropped(boxName) {
   return this.state.droppedBoxNames.indexOf(boxName) > -1;
  }

  handleDrop(index, name, insertAt) {
    this.setState(update(this.state, {
      dustbins: {
        [index]: {
          lastDroppedItem: {
            $set: name
          }
        }
      },
      items: {
        $splice: [[insertAt+1, 0, DemoFixtures.item]]
      },
      droppedBoxNames: name ? {
        $push: [name]
      } : {}
    }));
  }

  render() {
    // let item = DemoFixtures.item;
    let { boxes, dustbins, cursor} = this.state
    return (
      <div>
        <div style={{ overflow: 'hidden', clear: 'both' }}>
          {dustbins.map(({ accepts, lastDroppedItem }, index) =>
            <Carousel theme="dedcarousel--custom_padding dedcarousel--ratio16_9"
                      items={this.state.items}
                      sortable={true}
                      moveCard={this.moveCard}
                      accepts={accepts}
                      onDrop={(item, insertAt) => this.handleDrop(index, item, insertAt)}
                      key={index}/>
            )}
        </div>

          <div style={{ overflow: 'hidden', clear: 'both' }}>
            {boxes.map(({ name, type }, index) =>
              <Card name={name}
                   type={type}
                   isDropped={this.isDropped(name)}
                   key={index} />
            )}
          </div>
    </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(Root);
