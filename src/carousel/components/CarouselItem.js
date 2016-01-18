import React from 'react';
import deepEquals from 'deep-equal';
import { DragSource, DropTarget } from 'react-dnd';
import Dustbin from './Dustbin';
import Measure from 'react-measure';

class CarouselItem extends React.Component {

  /**
   * Ctor
   */
  constructor(props) {
    super(props);
    this.state = {
      dimensions:{}
    };
    this.onItemClicked = this.onItemClicked.bind(this);
    this.removeIt = this.removeIt.bind(this);
  }

  /**
   * Clicking an item should trigger this callback
   */
  onItemClicked(e) {
    if(this.props.clickCallback) this.props.clickCallback(e, this.props.data);
  }

  /**
   * When the component is mounted, plug the click listener
   */
  componentDidMount() {
    if(this.props.clickCallback) {
      React.findDOMNode(this).addEventListener('click', this.onItemClicked);
    }
  }

  /**
   * Remove the listener
   */
  componentWillUnmount() {
    if(this.props.clickCallback) {
      React.findDOMNode(this).removeEventListener('click', this.onItemClicked);
    }
  }

  /**
   * Re-render only when the props change
   */
  shouldComponentUpdate(nextProps, nextState) {
    return !(deepEquals(nextProps, this.props));
  }

  /**
   * Get the asset background
   */
  getAssetBackground(attr) {
    let bg = this.props.isReady ? `url(${attr})` : 'none';
    return { backgroundImage: bg };
  }

  /**
   * The default standard template
   */
  getDefaultTemplate() {
    return (
      <a href={this.props.data.link} className={ `${this.props.basename}__item` }>
        <div className={ `${this.props.basename}__media` } style={this.getAssetBackground(this.props.data.asset)}></div>
      </a>
    );
  }

  renderDustbin () {
    let {dimensions} = this.state;
    return <Dustbin
            accepts={this.props.accepts}
            onDrop={this.props.onDrop}
            index={this.props.index}
            dimensions={dimensions}/>
  }

  //todo issue mouse offset
  getSortableTemplate() {
    const { isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;
    return connectDragSource(connectDropTarget(
      <span className={ `${this.props.basename}__wrapper` }>
        <a  className={ `${this.props.basename}__item ${this.props.basename}__item--sortable` }>
          <Measure onChange={d => this.setState({dimensions: d})}>
          <div className={ `${this.props.basename}__media` }
            style={this.getAssetBackground(this.props.data.asset)}>
          </div>
        </Measure>
      </a>
        {this.renderDustbin()}
      </span>
    ));
  }

  /**
   * Render the default template or get it into the custom ones
   */
  render() {
    if(this.props.sortable) return this.getSortableTemplate();
    if(!this.props.customTemplateFn) return this.getDefaultTemplate();
    else return this.props.customTemplateFn(this);
  }

  /**
   * Remove this current item
   */
  removeIt() {
    this.props.removeItemFn(this.props.data._index_);
  }

}

/**
 * Statics
 */
CarouselItem.defaultProps = {
  data: {},
  basename: 'dedcarousel',
  customTemplateFn: undefined,
  isReady: false,
  clickCallback: null,
  removeItemFn: function() {},
};

CarouselItem.propTypes = {
  connectDragSource: React.PropTypes.func.isRequired,
  connectDropTarget: React.PropTypes.func.isRequired,
  index: React.PropTypes.number.isRequired,
  isDragging: React.PropTypes.bool.isRequired,
  id: React.PropTypes.any,
  moveCard: React.PropTypes.func
}

const cardSource = {
  beginDrag(props, monitor,component) {
    return {
      id: props.id,
      index: props.index
    };
  },
  endDrag(props,monitor,component) {

  }
};

const cardTarget = {
  hover(props, monitor, component) {
    const ownId = props.id;
    const draggedId = monitor.getItem().id;
    if (draggedId === ownId) {
      return;
    }
    const ownIndex = props.index;
    const draggedIndex = monitor.getItem().index;

    // What is my rectangle on screen?
    const boundingRect = React.findDOMNode(component).getBoundingClientRect();
    // Where is the mouse right now?
    const clientOffset = monitor.getClientOffset();

    // Where is my vertical middle?
    const ownMiddleY = (boundingRect.bottom - boundingRect.top) / 2;
    // How many pixels to the top?
    const offsetY = clientOffset.y - boundingRect.top;

    // We only want to move when the mouse has crossed half of the item's height.
    // If we're dragging down, we want to move only if we're below 50%.
    // If we're dragging up, we want to move only if we're above 50%.

    // Moving down: exit if we're in upper half
    if (draggedIndex < ownIndex && offsetY < ownMiddleY) {
      return;
    }

    // Moving up: exit if we're in lower half
    if (draggedIndex > ownIndex && offsetY > ownMiddleY) {
      return;
    }

    // Time to actually perform the action!
    props.moveCard(draggedId, ownId);
  }
};

export default DropTarget(
                "card",
                cardTarget,
                connect => ({
                  connectDropTarget: connect.dropTarget()
                })
              )(
                DragSource(
                "card",
                cardSource,
                (connect, monitor) => ({
                  connectDragSource: connect.dragSource(),
                  isDragging: monitor.isDragging()
                })
                )(CarouselItem)
            );
