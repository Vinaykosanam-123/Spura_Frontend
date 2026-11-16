import type { Problem } from "../problems";

export const LISTS_STACKS_PROBLEMS: Problem[] = [
  {
    id: "reverse-linked-list",
    slug: "reverse-linked-list",
    title: "31. Reverse Linked List",
    difficulty: "Easy",
    topic: "Linked Lists",
    acceptance: "76.1%",
    companies: ["Microsoft", "Amazon", "Meta", "TCS"],
    diagramType: "linked_list",
    description: `Given the \`head\` of a singly linked list, reverse the list iteratively and return the reversed list.`,
    examples: [{ input: "head = [1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]" }],
    constraints: ["0 <= nodes <= 5000"],
    defaultStdin: "1 2 3 4 5",
    templates: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

head = ListNode(1, ListNode(2, ListNode(3, ListNode(4, ListNode(5)))))
res = reverseList(head)
out = []
while res:
    out.append(res.val)
    res = res.next
print("Reversed:", out)
`,
      javascript: `class ListNode {
  constructor(val = 0, next = null) { this.val = val; this.next = next; }
}
function reverseList(head) {
  let prev = null, curr = head;
  while (curr) {
    const nxt = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nxt;
  }
  return prev;
}
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
let res = reverseList(head);
const out = [];
while (res) { out.push(res.val); res = res.next; }
console.log("Reversed:", out);
`,
      cpp: `#include <iostream>
using namespace std;
struct ListNode { int val; ListNode* next; ListNode(int v, ListNode* n=nullptr):val(v),next(n){} };
int main() {
    ListNode* h = new ListNode(1, new ListNode(2, new ListNode(3)));
    ListNode *prev = nullptr, *curr = h;
    while (curr) { auto n = curr->next; curr->next = prev; prev = curr; curr = n; }
    while (prev) { cout << prev->val << " "; prev = prev->next; }
}
`,
      java: `public class Main {
    static class ListNode { int val; ListNode next; ListNode(int v, ListNode n){val=v;next=n;} }
    public static void main(String[] args) {
        ListNode h = new ListNode(1, new ListNode(2, new ListNode(3, null))), prev = null, curr = h;
        while (curr != null) { ListNode n = curr.next; curr.next = prev; prev = curr; curr = n; }
        while (prev != null) { System.out.print(prev.val + " "); prev = prev.next; }
    }
}
`,
    },
  },
  {
    id: "middle-of-linked-list",
    slug: "middle-of-linked-list",
    title: "32. Middle of the Linked List",
    difficulty: "Easy",
    topic: "Linked Lists",
    acceptance: "78.4%",
    companies: ["Amazon", "Google", "Wipro", "Infosys"],
    diagramType: "linked_list",
    description: `Using slow and fast pointers, return the middle node of the linked list (second middle if even length).`,
    examples: [{ input: "head = [1, 2, 3, 4, 5]", output: "3" }],
    constraints: ["1 <= nodes <= 100"],
    defaultStdin: "1 2 3 4 5",
    templates: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def middleNode(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

head = ListNode(1, ListNode(2, ListNode(3, ListNode(4, ListNode(5)))))
mid = middleNode(head)
print("Middle value:", mid.val)
`,
      javascript: `class ListNode { constructor(val=0, next=null){this.val=val;this.next=next;} }
function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow;
}
const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
console.log("Middle value:", middleNode(head).val);
`,
      cpp: `#include <iostream>
using namespace std;
struct ListNode { int val; ListNode* next; ListNode(int v, ListNode* n=nullptr):val(v),next(n){} };
int main() {
    ListNode* h = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
    auto *slow = h, *fast = h;
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    cout << slow->val << endl;
}
`,
      java: `public class Main {
    static class ListNode{int val;ListNode next;ListNode(int v,ListNode n){val=v;next=n;}}
    public static void main(String[] args) {
        ListNode h = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5, null)))));
        ListNode slow=h, fast=h;
        while(fast!=null&&fast.next!=null){slow=slow.next;fast=fast.next.next;}
        System.out.println(slow.val);
    }
}
`,
    },
  },
  {
    id: "merge-two-sorted-lists",
    slug: "merge-two-sorted-lists",
    title: "33. Merge Two Sorted Lists",
    difficulty: "Easy",
    topic: "Linked Lists",
    acceptance: "64.4%",
    companies: ["Amazon", "Microsoft", "Meta", "Apple"],
    diagramType: "linked_list",
    description: `Merge two sorted linked lists into one sorted list by splicing node pointers.`,
    examples: [{ input: "list1 = [1, 2, 4], list2 = [1, 3, 4]", output: "[1, 1, 2, 3, 4, 4]" }],
    constraints: ["0 <= nodes <= 50"],
    defaultStdin: "1 2 4\n1 3 4",
    templates: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def mergeTwoLists(l1, l2):
    dummy = tail = ListNode(-1)
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next = l1
            l1 = l1.next
        else:
            tail.next = l2
            l2 = l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next

l1 = ListNode(1, ListNode(2, ListNode(4)))
l2 = ListNode(1, ListNode(3, ListNode(4)))
curr = mergeTwoLists(l1, l2)
vals = []
while curr: vals.append(curr.val); curr = curr.next
print("Merged:", vals)
`,
      javascript: `class ListNode { constructor(val=0, next=null){this.val=val;this.next=next;} }
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(-1);
  let tail = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
    else { tail.next = l2; l2 = l2.next; }
    tail = tail.next;
  }
  tail.next = l1 || l2;
  return dummy.next;
}
let curr = mergeTwoLists(new ListNode(1, new ListNode(2, new ListNode(4))), new ListNode(1, new ListNode(3, new ListNode(4))));
const vals = [];
while (curr) { vals.push(curr.val); curr = curr.next; }
console.log("Merged:", vals);
`,
      cpp: `#include <iostream>
using namespace std;
struct ListNode{int val;ListNode* next;ListNode(int v,ListNode* n=nullptr):val(v),next(n){}};
int main(){
    ListNode d(-1), *t=&d, *a=new ListNode(1,new ListNode(3)), *b=new ListNode(2,new ListNode(4));
    while(a&&b){if(a->val<=b->val){t->next=a;a=a->next;}else{t->next=b;b=b->next;}t=t->next;}
    t->next=a?a:b; for(auto p=d.next;p;p=p->next)cout<<p->val<<" ";
}
`,
      java: `public class Main {
    static class ListNode{int val;ListNode next;ListNode(int v,ListNode n){val=v;next=n;}}
    public static void main(String[] args){
        ListNode d=new ListNode(-1,null),t=d,a=new ListNode(1,new ListNode(3,null)),b=new ListNode(2,new ListNode(4,null));
        while(a!=null&&b!=null){if(a.val<=b.val){t.next=a;a=a.next;}else{t.next=b;b=b.next;}t=t.next;}
        t.next=(a!=null)?a:b; for(ListNode p=d.next;p!=null;p=p.next)System.out.print(p.val+" ");
    }
}
`,
    },
  },
  {
    id: "linked-list-cycle",
    slug: "linked-list-cycle",
    title: "34. Linked List Cycle (Floyd's Tortoise & Hare)",
    difficulty: "Easy",
    topic: "Linked Lists",
    acceptance: "50.5%",
    companies: ["Amazon", "Microsoft", "Adobe", "Goldman Sachs"],
    diagramType: "linked_list",
    description: `Determine whether a linked list contains a cycle using Floyd's slow and fast pointer algorithm in \`O(1)\` space.`,
    examples: [{ input: "head = [3, 2, 0, -4], pos = 1", output: "true" }],
    constraints: ["0 <= nodes <= 10^4"],
    defaultStdin: "3 2 0 -4\n1",
    templates: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False

n1, n2, n3, n4 = ListNode(3), ListNode(2), ListNode(0), ListNode(-4)
n1.next = n2; n2.next = n3; n3.next = n4; n4.next = n2
print("Cycle detected:", hasCycle(n1))
`,
      javascript: `class ListNode { constructor(val=0){this.val=val;this.next=null;} }
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
const n1 = new ListNode(3), n2 = new ListNode(2), n3 = new ListNode(0), n4 = new ListNode(-4);
n1.next = n2; n2.next = n3; n3.next = n4; n4.next = n2;
console.log("Cycle detected:", hasCycle(n1));
`,
      cpp: `#include <iostream>
using namespace std;
struct ListNode{int val;ListNode* next;ListNode(int v):val(v),next(nullptr){}};
int main(){
    auto*a=new ListNode(3),*b=new ListNode(2),*c=new ListNode(0);a->next=b;b->next=c;c->next=b;
    auto*s=a,*f=a; bool cyc=false;
    while(f&&f->next){s=s->next;f=f->next->next;if(s==f){cyc=true;break;}}
    cout<<(cyc?"true":"false")<<endl;
}
`,
      java: `public class Main {
    static class ListNode{int val;ListNode next;ListNode(int v){val=v;}}
    public static void main(String[] args){
        ListNode a=new ListNode(3),b=new ListNode(2),c=new ListNode(0);a.next=b;b.next=c;c.next=b;
        ListNode s=a,f=a;boolean cyc=false;
        while(f!=null&&f.next!=null){s=s.next;f=f.next.next;if(s==f){cyc=true;break;}}
        System.out.println(cyc);
    }
}
`,
    },
  },
  {
    id: "remove-nth-from-end",
    slug: "remove-nth-from-end",
    title: "35. Remove Nth Node From End of List",
    difficulty: "Medium",
    topic: "Linked Lists",
    acceptance: "45.8%",
    companies: ["Meta", "Amazon", "Google"],
    diagramType: "linked_list",
    description: `Remove the \`n\`-th node from the end of a linked list in one pass using a two-pointer gap.`,
    examples: [{ input: "head = [1, 2, 3, 4, 5], n = 2", output: "[1, 2, 3, 5]" }],
    constraints: ["1 <= sz <= 30, 1 <= n <= sz"],
    defaultStdin: "1 2 3 4 5\n2",
    templates: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def removeNthFromEnd(head, n):
    dummy = ListNode(0, head)
    slow = fast = dummy
    for _ in range(n + 1):
        fast = fast.next
    while fast:
        slow = slow.next
        fast = fast.next
    slow.next = slow.next.next
    return dummy.next

head = ListNode(1, ListNode(2, ListNode(3, ListNode(4, ListNode(5)))))
res = removeNthFromEnd(head, 2)
vals = []
while res: vals.append(res.val); res = res.next
print("After removal:", vals)
`,
      javascript: `class ListNode { constructor(val=0,next=null){this.val=val;this.next=next;} }
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let slow = dummy, fast = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast) { slow = slow.next; fast = fast.next; }
  slow.next = slow.next.next;
  return dummy.next;
}
let res = removeNthFromEnd(new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5))))), 2);
const vals = [];
while (res) { vals.push(res.val); res = res.next; }
console.log("After removal:", vals);
`,
      cpp: `#include <iostream>
using namespace std;
struct ListNode{int val;ListNode* next;ListNode(int v,ListNode* n=nullptr):val(v),next(n){}};
int main(){
    ListNode d(0,new ListNode(1,new ListNode(2,new ListNode(3,new ListNode(4,new ListNode(5))))));
    auto*s=&d,*f=&d; for(int i=0;i<=2;i++)f=f->next;
    while(f){s=s->next;f=f->next;} s->next=s->next->next;
    for(auto p=d.next;p;p=p->next)cout<<p->val<<" ";
}
`,
      java: `public class Main {
    static class ListNode{int val;ListNode next;ListNode(int v,ListNode n){val=v;next=n;}}
    public static void main(String[] args){
        ListNode d=new ListNode(0,new ListNode(1,new ListNode(2,new ListNode(3,new ListNode(4,new ListNode(5,null)))))),s=d,f=d;
        for(int i=0;i<=2;i++)f=f.next; while(f!=null){s=s.next;f=f.next;} s.next=s.next.next;
        for(ListNode p=d.next;p!=null;p=p.next)System.out.print(p.val+" ");
    }
}
`,
    },
  },
  {
    id: "palindrome-linked-list",
    slug: "palindrome-linked-list",
    title: "36. Palindrome Linked List",
    difficulty: "Easy",
    topic: "Linked Lists",
    acceptance: "53.1%",
    companies: ["Amazon", "Meta", "Microsoft"],
    diagramType: "linked_list",
    description: `Check whether a singly linked list is a palindrome in \`O(n)\` time and \`O(1)\` extra space by reversing its second half.`,
    examples: [{ input: "head = [1, 2, 2, 1]", output: "true" }],
    constraints: ["1 <= nodes <= 10^5"],
    defaultStdin: "1 2 2 1",
    templates: {
      python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def isPalindrome(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    prev = None
    while slow:
        nxt = slow.next
        slow.next = prev
        prev = slow
        slow = nxt
    left, right = head, prev
    while right:
        if left.val != right.val:
            return False
        left = left.next
        right = right.next
    return True

head = ListNode(1, ListNode(2, ListNode(2, ListNode(1))))
print("Is palindrome:", isPalindrome(head))
`,
      javascript: `class ListNode { constructor(val=0,next=null){this.val=val;this.next=next;} }
function isPalindrome(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  let prev = null;
  while (slow) { const n = slow.next; slow.next = prev; prev = slow; slow = n; }
  let l = head, r = prev;
  while (r) { if (l.val !== r.val) return false; l = l.next; r = r.next; }
  return true;
}
console.log("Is palindrome:", isPalindrome(new ListNode(1, new ListNode(2, new ListNode(2, new ListNode(1))))));
`,
      cpp: `#include <iostream>
using namespace std;
struct ListNode{int val;ListNode* next;ListNode(int v,ListNode* n=nullptr):val(v),next(n){}};
int main(){
    auto*h=new ListNode(1,new ListNode(2,new ListNode(2,new ListNode(1))));
    auto*s=h,*f=h;while(f&&f->next){s=s->next;f=f->next->next;}
    ListNode*p=nullptr;while(s){auto n=s->next;s->next=p;p=s;s=n;}
    bool ok=true;while(p){if(h->val!=p->val)ok=false;h=h->next;p=p->next;}
    cout<<(ok?"true":"false")<<endl;
}
`,
      java: `public class Main {
    static class ListNode{int val;ListNode next;ListNode(int v,ListNode n){val=v;next=n;}}
    public static void main(String[] args){
        ListNode h=new ListNode(1,new ListNode(2,new ListNode(2,new ListNode(1,null)))),s=h,f=h,p=null;
        while(f!=null&&f.next!=null){s=s.next;f=f.next.next;}
        while(s!=null){ListNode n=s.next;s.next=p;p=s;s=n;}
        boolean ok=true;while(p!=null){if(h.val!=p.val)ok=false;h=h.next;p=p.next;}
        System.out.println(ok);
    }
}
`,
    },
  },
  {
    id: "valid-parentheses",
    slug: "valid-parentheses",
    title: "37. Valid Parentheses",
    difficulty: "Easy",
    topic: "Stacks & Queues",
    acceptance: "40.8%",
    companies: ["Amazon", "Meta", "Google", "Bloomberg"],
    diagramType: "stack",
    description: `Determine if a bracket string containing \`()[]{}\` is valid using a LIFO stack.`,
    examples: [{ input: 's = "{[()]}"', output: "true" }],
    constraints: ["1 <= s.length <= 10^4"],
    defaultStdin: "{[()]}",
    templates: {
      python: `def isValid(s):
    stack = []
    pairs = {")": "(", "}": "{", "]": "["}
    for ch in s:
        if ch in pairs.values():
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return len(stack) == 0

print("Valid:", isValid("{[()]}"))
`,
      javascript: `function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "}": "{", "]": "[" };
  for (const ch of s) {
    if (ch === "(" || ch === "{" || ch === "[") stack.push(ch);
    else if (pairs[ch]) {
      if (stack.length === 0 || stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}
console.log("Valid:", isValid("{[()]}"));
`,
      cpp: `#include <iostream>
#include <stack>
using namespace std;
int main() {
    string s = "{[()]}"; stack<char> st; bool ok = true;
    for (char c : s) {
        if (c=='('||c=='['||c=='{') st.push(c);
        else { if (st.empty()) ok=false; else st.pop(); }
    }
    cout << (ok && st.empty() ? "true" : "false") << endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        String s = "{[()]}"; Stack<Character> st = new Stack<>();
        for (char c : s.toCharArray()) { if (c=='('||c=='['||c=='{') st.push(c); else if (!st.isEmpty()) st.pop(); }
        System.out.println(st.isEmpty());
    }
}
`,
    },
  },
  {
    id: "min-stack",
    slug: "min-stack",
    title: "38. Min Stack (O(1) Minimum)",
    difficulty: "Medium",
    topic: "Stacks & Queues",
    acceptance: "54.2%",
    companies: ["Amazon", "Bloomberg", "Microsoft", "Uber"],
    diagramType: "stack",
    description: `Design a stack supporting push, pop, top, and retrieving the current minimum element in \`O(1)\` time.`,
    examples: [{ input: "push(-2), push(0), push(-3), getMin(), pop(), getMin()", output: "-3, -2" }],
    constraints: ["All operations O(1)"],
    defaultStdin: "-2 0 -3",
    templates: {
      python: `def runMinStack(ops):
    stack = []
    min_stack = []
    out = []
    for op, val in ops:
        if op == "push":
            stack.append(val)
            min_stack.append(val if not min_stack else min(val, min_stack[-1]))
        elif op == "pop":
            stack.pop()
            min_stack.pop()
        elif op == "min":
            out.append(min_stack[-1])
    return out

ops = [("push", -2), ("push", 0), ("push", -3), ("min", 0), ("pop", 0), ("min", 0)]
print("Min outputs:", runMinStack(ops))
`,
      javascript: `const stack = [], minStack = [];
function pushVal(v) {
  stack.push(v);
  minStack.push(minStack.length ? Math.min(v, minStack[minStack.length - 1]) : v);
}
function popVal() { stack.pop(); minStack.pop(); }
pushVal(-2); pushVal(0); pushVal(-3);
console.log("Min 1:", minStack[minStack.length - 1]);
popVal();
console.log("Min 2:", minStack[minStack.length - 1]);
`,
      cpp: `#include <iostream>
#include <stack>
using namespace std;
int main() {
    stack<int> st, mn;
    for (int x : {-2, 0, -3}) { st.push(x); mn.push(mn.empty() ? x : min(x, mn.top())); }
    cout << mn.top() << " "; st.pop(); mn.pop(); cout << mn.top() << endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Stack<Integer> st = new Stack<>(), mn = new Stack<>();
        for (int x : new int[]{-2, 0, -3}) { st.push(x); mn.push(mn.isEmpty() ? x : Math.min(x, mn.peek())); }
        System.out.println(mn.peek()); st.pop(); mn.pop(); System.out.println(mn.peek());
    }
}
`,
    },
  },
  {
    id: "daily-temperatures",
    slug: "daily-temperatures",
    title: "39. Daily Temperatures (Monotonic Stack)",
    difficulty: "Medium",
    topic: "Stacks & Queues",
    acceptance: "66.1%",
    companies: ["Meta", "Amazon", "Google", "Bloomberg"],
    diagramType: "stack",
    description: `Given daily temperatures, return for each day how many days until a warmer temperature occurs using a monotonic decreasing stack.`,
    examples: [{ input: "temperatures = [73, 74, 75, 71, 69, 72, 76, 73]", output: "[1, 1, 4, 2, 1, 1, 0, 0]" }],
    constraints: ["1 <= temperatures.length <= 10^5"],
    defaultStdin: "73 74 75 71 69 72 76 73",
    templates: {
      python: `def dailyTemperatures(temps):
    ans = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            prev = stack.pop()
            ans[prev] = i - prev
        stack.append(i)
    return ans

temps = [73, 74, 75, 71, 69, 72, 76, 73]
print("Days to wait:", dailyTemperatures(temps))
`,
      javascript: `function dailyTemperatures(temps) {
  const ans = Array(temps.length).fill(0), stack = [];
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {
      const prev = stack.pop();
      ans[prev] = i - prev;
    }
    stack.push(i);
  }
  return ans;
}
const temps = [73, 74, 75, 71, 69, 72, 76, 73];
console.log("Days to wait:", dailyTemperatures(temps));
`,
      cpp: `#include <iostream>
#include <vector>
#include <stack>
using namespace std;
int main() {
    vector<int> t={73,74,75,71,69,72,76,73}, ans(t.size(),0); stack<int> st;
    for(int i=0;i<(int)t.size();i++){while(!st.empty()&&t[st.top()]<t[i]){ans[st.top()]=i-st.top();st.pop();}st.push(i);}
    for(int x:ans) cout<<x<<" ";
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] t={73,74,75,71,69,72,76,73}, ans=new int[t.length]; Stack<Integer> st=new Stack<>();
        for(int i=0;i<t.length;i++){while(!st.isEmpty()&&t[st.peek()]<t[i]){int p=st.pop();ans[p]=i-p;}st.push(i);}
        System.out.println(Arrays.toString(ans));
    }
}
`,
    },
  },
  {
    id: "next-greater-element-i",
    slug: "next-greater-element-i",
    title: "40. Next Greater Element",
    difficulty: "Easy",
    topic: "Stacks & Queues",
    acceptance: "72.4%",
    companies: ["Amazon", "Goldman Sachs", "TCS"],
    diagramType: "stack",
    description: `Compute the next strictly greater element to the right for each element in \`nums\` using a monotonic stack.`,
    examples: [{ input: "nums = [4, 5, 2, 10, 8]", output: "[5, 10, 10, -1, -1]" }],
    constraints: ["1 <= nums.length <= 10^4"],
    defaultStdin: "4 5 2 10 8",
    templates: {
      python: `def nextGreater(nums):
    res = [-1] * len(nums)
    stack = []
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            res[stack.pop()] = x
        stack.append(i)
    return res

nums = [4, 5, 2, 10, 8]
print("Next greater:", nextGreater(nums))
`,
      javascript: `function nextGreater(nums) {
  const res = Array(nums.length).fill(-1), stack = [];
  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {
      res[stack.pop()] = nums[i];
    }
    stack.push(i);
  }
  return res;
}
console.log("Next greater:", nextGreater([4, 5, 2, 10, 8]));
`,
      cpp: `#include <iostream>
#include <vector>
#include <stack>
using namespace std;
int main() {
    vector<int> a={4,5,2,10,8}, r(a.size(),-1); stack<int> st;
    for(int i=0;i<(int)a.size();i++){while(!st.empty()&&a[st.top()]<a[i]){r[st.top()]=a[i];st.pop();}st.push(i);}
    for(int x:r) cout<<x<<" ";
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] a={4,5,2,10,8}, r=new int[a.length]; Arrays.fill(r,-1); Stack<Integer> st=new Stack<>();
        for(int i=0;i<a.length;i++){while(!st.isEmpty()&&a[st.peek()]<a[i])r[st.pop()]=a[i];st.push(i);}
        System.out.println(Arrays.toString(r));
    }
}
`,
    },
  },
  {
    id: "evaluate-reverse-polish-notation",
    slug: "evaluate-reverse-polish-notation",
    title: "41. Evaluate Reverse Polish Notation",
    difficulty: "Medium",
    topic: "Stacks & Queues",
    acceptance: "52.1%",
    companies: ["Amazon", "Google", "LinkedIn"],
    diagramType: "stack",
    description: `Evaluate an arithmetic expression in Reverse Polish (postfix) Notation using an operand stack.`,
    examples: [{ input: 'tokens = ["2","1","+","3","*"]', output: "9" }],
    constraints: ["1 <= tokens.length <= 10^4"],
    defaultStdin: "2 1 + 3 *",
    templates: {
      python: `def evalRPN(tokens):
    stack = []
    for tok in tokens:
        if tok in {"+", "-", "*", "/"}:
            b, a = stack.pop(), stack.pop()
            if tok == "+": stack.append(a + b)
            elif tok == "-": stack.append(a - b)
            elif tok == "*": stack.append(a * b)
            else: stack.append(int(a / b))
        else:
            stack.append(int(tok))
    return stack[0]

tokens = ["2", "1", "+", "3", "*"]
print("Result:", evalRPN(tokens))
`,
      javascript: `function evalRPN(tokens) {
  const stack = [];
  for (const tok of tokens) {
    if ("+-*/".includes(tok) && tok.length === 1) {
      const b = stack.pop(), a = stack.pop();
      if (tok === "+") stack.push(a + b);
      else if (tok === "-") stack.push(a - b);
      else if (tok === "*") stack.push(a * b);
      else stack.push(Math.trunc(a / b));
    } else stack.push(Number(tok));
  }
  return stack[0];
}
console.log("Result:", evalRPN(["2", "1", "+", "3", "*"]));
`,
      cpp: `#include <iostream>
#include <vector>
#include <stack>
using namespace std;
int main() {
    vector<string> t={"2","1","+","3","*"}; stack<int> st;
    for(auto&s:t){if(s=="+"||s=="-"||s=="*"||s=="/"){int b=st.top();st.pop();int a=st.top();st.pop();st.push(s=="+"?a+b:s=="-"?a-b:s=="*"?a*b:a/b);}else st.push(stoi(s));}
    cout<<st.top()<<endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        String[] t={"2","1","+","3","*"}; Stack<Integer> st=new Stack<>();
        for(String s:t){if("+-*/".contains(s)){int b=st.pop(),a=st.pop();st.push(s.equals("+")?a+b:s.equals("-")?a-b:s.equals("*")?a*b:a/b);}else st.push(Integer.parseInt(s));}
        System.out.println(st.peek());
    }
}
`,
    },
  },
  {
    id: "largest-rectangle-histogram",
    slug: "largest-rectangle-histogram",
    title: "42. Largest Rectangle in Histogram",
    difficulty: "Hard",
    topic: "Stacks & Queues",
    acceptance: "45.0%",
    companies: ["Amazon", "Google", "Microsoft", "Uber"],
    diagramType: "stack",
    description: `Find the area of the largest rectangle inside a histogram of bar heights using a monotonic increasing stack.`,
    examples: [{ input: "heights = [2, 1, 5, 6, 2, 3]", output: "10" }],
    constraints: ["1 <= heights.length <= 10^5"],
    defaultStdin: "2 1 5 6 2 3",
    templates: {
      python: `def largestRectangleArea(heights):
    stack = [-1]
    best = 0
    arr = heights + [0]
    for i, h in enumerate(arr):
        while stack[-1] != -1 and arr[stack[-1]] >= h:
            height = arr[stack.pop()]
            width = i - stack[-1] - 1
            best = max(best, height * width)
        stack.append(i)
    return best

heights = [2, 1, 5, 6, 2, 3]
print("Max rectangle:", largestRectangleArea(heights))
`,
      javascript: `function largestRectangleArea(heights) {
  const stack = [-1], arr = [...heights, 0];
  let best = 0;
  for (let i = 0; i < arr.length; i++) {
    while (stack[stack.length - 1] !== -1 && arr[stack[stack.length - 1]] >= arr[i]) {
      const h = arr[stack.pop()];
      const w = i - stack[stack.length - 1] - 1;
      best = Math.max(best, h * w);
    }
    stack.push(i);
  }
  return best;
}
console.log("Max rectangle:", largestRectangleArea([2, 1, 5, 6, 2, 3]));
`,
      cpp: `#include <iostream>
#include <vector>
#include <stack>
using namespace std;
int main() {
    vector<int> h={2,1,5,6,2,3,0}; stack<int> st; st.push(-1); int best=0;
    for(int i=0;i<(int)h.size();i++){while(st.top()!=-1&&h[st.top()]>=h[i]){int ht=h[st.top()];st.pop();best=max(best,ht*(i-st.top()-1));}st.push(i);}
    cout<<best<<endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] h={2,1,5,6,2,3,0}; Stack<Integer> st=new Stack<>(); st.push(-1); int best=0;
        for(int i=0;i<h.length;i++){while(st.peek()!=-1&&h[st.peek()]>=h[i]){int ht=h[st.pop()];best=Math.max(best,ht*(i-st.peek()-1));}st.push(i);}
        System.out.println(best);
    }
}
`,
    },
  },
];
