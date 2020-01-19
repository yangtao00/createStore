const state = {
  name: 'yyt',
  // title: '前端开发',
  todos: [
    {
      task: '吃早餐',
      completed: false,
    },
    {
      task: '刷知乎',
      completed: false,
    },
    {
      title: '逛淘宝',
      completed: false,
    },
  ],
};

const todos = [
  {
    task: '吃早餐',
    completed: false,
  },
  {
    task: '刷知乎',
    completed: false,
  },
  {
    title: '逛淘宝',
    completed: false,
  },
];

function todosReducer(state = todos, action) {
  const { type } = action;
  switch (type) {
    case 'task_completed':
      return state.map((todo, index) => {
        if (index === action.index) {
          return {
            ...todo,
            completed: true,
          };
        }
        return todo;
      });
    default:
      return state;
  }
}

const names = {
  name: 'yyt',
};

function nameReducer(state = names, action) {
  const { type, name } = action;
  switch (type) {
    case 'changename':
      return { ...state, name };
    default:
      return state;
  }
}

function createStore(reducer, initialState, enhancer) {
  // 如果传入的 initialState 是一个函数，且没有传入 enhancer, 将 initialState 赋值给 enhancer
  if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
    enhancer = initialState;
    initialState = undefined;
  }

  if (typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, initialState);
  }

  let currState = typeof initialState === 'object' ? initialState : undefined;
  const listeners = [];

  function dispatch(action) {
    // console.log('currState:', currState);
    currState = reducer(currState, action);
    // currState = Object.assign(initialState, reducer(currState, action));
    // 通知监听对象
    for (let i = 0, len = listeners.length; i < len; i++) {
      listeners[i]();
    }
    // console.log('nextState:', currState);
  }

  function subscribe(listener) {
    listeners.push(listener);
    // 返回一个解除对应监听的函数
    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  function getStore() {
    return currState;
  }

  dispatch({ type: 'INIT' });

  return {
    subscribe,
    getStore,
    dispatch,
  };
}

function combineReducers(reducers) {
  return function(state = {}, action = {}) {
    const nextState = {};
    Object.keys(reducers).reduce((prev, curr) => {
      nextState[curr] = reducers[curr](state[curr], action);
    }, '');
    return nextState;
  };
}

// 定义几个 middleware
const logMiddleware1 = store => next => action => {
  console.log('currState:', store.getStore());
  next(action);
  console.log('nextState:', store.getStore());
};

const logMiddleware2 = store => next => action => {
  console.log('当前时间：', new Date().toLocaleDateString());
  console.log('当前 action:', action);
  next(action);
};

// function applyMiddleware(store, ...middlewares) {
//   let next = store.dispatch;
//   middlewares.reverse().map(middleware => {
//     next = middleware(store)(next)
//   });
//   return next;
// }

// const { dispatch, subscribe, getStore } = createStore(combineReducers({todos: todosReducer, name: nameReducer}));
// const store = createStore(combineReducers({todos: todosReducer, name: nameReducer}), state);

// store.dispatch = applyMiddleware(store, logMiddleware1, logMiddleware2);

function compose(...chain) {
  const len = chain.length;
  if (len === 0) return;
  if (len === 1) return chain[0];
  return chain.reduce((a, b) => (...args) => a(b(...args)));
}


function applyMiddleware(...middlewares) {
  return createStore => (state, initialState, enhancer) => {
    const newStore = createStore(state, initialState, enhancer);
    let next = newStore.dispatch;
    // middlewares.reverse().map(middleware => {
    //   next = middleware(newStore)(next);
    // });
    // 注意：这里不能再返回 `next` 了，应该返回一个应用了 `middleware` 后的 `store` 副本， 因为我们在 `createStore` 里面处理 `enhancer`的时候，返回了一个应用了 `enhancer`的 `createStore`
    // return next;
    const {
      dispatch,
      getStore,
    } = newStore;
    const middlewareApi = {
      dispatch,
      getStore,
    }
    const chain = middlewares.map(middleware => middleware(middlewareApi));
    next = compose(...chain)(next);
    return {
      ...newStore,
      dispatch: next,
    };
  };
}
const store = createStore(
  combineReducers({ todos: todosReducer, name: nameReducer }),
  applyMiddleware(logMiddleware1, logMiddleware2),
);

// 更改 todo
store.dispatch({
  type: 'task_completed',
  index: 0, // 通过 `index` 去匹配吃早餐这个todo
});

// 更改 name
store.dispatch({
  type: 'changename',
  name: 'xyy',
})
