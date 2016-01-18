import React, { PropTypes, Component } from 'react';
import { DropTarget } from 'react-dnd';

class Dustbin extends Component {
    render () {
        const { canDrop, isOver, connectDropTarget, dimensions } = this.props;
        const isActive = canDrop && isOver;
        const style = {
          height : dimensions.height
        };
        const className = isActive  ? 'dustbin dustbin--active' : 'dustbin'
        return connectDropTarget(
            <div style={style} className={className} style={style}>
                {isActive ?
                    'Release to drop' :
                    'Drag a box here'
                }
            </div>
        );
    }
}

Dustbin.propTypes = {
  connectDropTarget: React.PropTypes.func.isRequired,
  isOver: React.PropTypes.bool.isRequired,
  canDrop: React.PropTypes.bool.isRequired,
  accepts: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  lastDroppedItem: React.PropTypes.object,
  onDrop: React.PropTypes.func.isRequired,
  index: React.PropTypes.number.isRequired
};

const dustbinTarget = {
  drop(props, monitor) {
    props.onDrop(monitor.getItem(), props.index);//content representation of dropped item
  }
};

export default DropTarget(props => props.accepts, dustbinTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))(Dustbin)
