import type { Problem } from "../problems";

export const TREES_DP_GRAPHS_PROBLEMS: Problem[] = [
  {
    id: "invert-binary-tree",
    slug: "invert-binary-tree",
    title: "43. Invert Binary Tree",
    difficulty: "Easy",
    topic: "Binary Trees & BSTs",
    acceptance: "77.2%",
    companies: ["Google", "Amazon", "Apple", "Microsoft"],
    diagramType: "binary_tree",
    description: `Given the \`root\` of a binary tree, invert the tree (mirror its left and right subtrees) and return its root.`,
    examples: [{ input: "root = [4, 2, 7, 1, 3, 6, 9]", output: "[4, 7, 2, 9, 6, 3, 1]" }],
    constraints: ["0 <= nodes <= 100"],
    defaultStdin: "4 2 7 1 3 6 9",
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def invertTree(root):
    if not root: return None
    root.left, root.right = root.right, root.left
    invertTree(root.left)
    invertTree(root.right)
    return root

root = TreeNode(4, TreeNode(2, TreeNode(1), TreeNode(3)), TreeNode(7, TreeNode(6), TreeNode(9)))
invertTree(root)
print("Inverted root left:", root.left.val, "right:", root.right.val)
`,
      javascript: `class TreeNode { constructor(val=0, left=null, right=null){this.val=val;this.left=left;this.right=right;} }
function invertTree(root) {
  if (!root) return null;
  [root.left, root.right] = [root.right, root.left];
  invertTree(root.left);
  invertTree(root.right);
  return root;
}
const root = new TreeNode(4, new TreeNode(2, new TreeNode(1), new TreeNode(3)), new TreeNode(7, new TreeNode(6), new TreeNode(9)));
invertTree(root);
console.log("Inverted children:", root.left.val, root.right.val);
`,
      cpp: `#include <iostream>
using namespace std;
struct TreeNode{int val;TreeNode* left,*right;TreeNode(int v,TreeNode*l=nullptr,TreeNode*r=nullptr):val(v),left(l),right(r){}};
TreeNode* inv(TreeNode* r){if(!r)return nullptr;swap(r->left,r->right);inv(r->left);inv(r->right);return r;}
int main(){TreeNode* r=new TreeNode(4,new TreeNode(2),new TreeNode(7));inv(r);cout<<r->left->val<<" "<<r->right->val<<endl;}
`,
      java: `public class Main {
    static class TreeNode{int val;TreeNode left,right;TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}
    static TreeNode inv(TreeNode r){if(r==null)return null;TreeNode t=r.left;r.left=r.right;r.right=t;inv(r.left);inv(r.right);return r;}
    public static void main(String[] args){TreeNode r=new TreeNode(4,new TreeNode(2,null,null),new TreeNode(7,null,null));inv(r);System.out.println(r.left.val+" "+r.right.val);}
}
`,
    },
  },
  {
    id: "max-depth-binary-tree",
    slug: "max-depth-binary-tree",
    title: "44. Maximum Depth of Binary Tree",
    difficulty: "Easy",
    topic: "Binary Trees & BSTs",
    acceptance: "75.6%",
    companies: ["Amazon", "Google", "LinkedIn"],
    diagramType: "binary_tree",
    description: `Compute the maximum depth (number of nodes along the longest root-to-leaf path) of a binary tree.`,
    examples: [{ input: "root = [3, 9, 20, null, null, 15, 7]", output: "3" }],
    constraints: ["0 <= nodes <= 10^4"],
    defaultStdin: "3 9 20 null null 15 7",
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def maxDepth(root):
    if not root: return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))

root = TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7)))
print("Max depth:", maxDepth(root))
`,
      javascript: `class TreeNode { constructor(val=0, left=null, right=null){this.val=val;this.left=left;this.right=right;} }
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
const root = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
console.log("Max depth:", maxDepth(root));
`,
      cpp: `#include <iostream>
using namespace std;
struct TreeNode{int val;TreeNode* left,*right;TreeNode(int v,TreeNode*l=nullptr,TreeNode*r=nullptr):val(v),left(l),right(r){}};
int depth(TreeNode* r){return r?1+max(depth(r->left),depth(r->right)):0;}
int main(){cout<<depth(new TreeNode(3,new TreeNode(9),new TreeNode(20)))<<endl;}
`,
      java: `public class Main {
    static class TreeNode{int val;TreeNode left,right;TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}
    static int depth(TreeNode r){return r==null?0:1+Math.max(depth(r.left),depth(r.right));}
    public static void main(String[] args){System.out.println(depth(new TreeNode(3,new TreeNode(9,null,null),new TreeNode(20,null,null))));}
}
`,
    },
  },
  {
    id: "symmetric-tree",
    slug: "symmetric-tree",
    title: "45. Symmetric Binary Tree",
    difficulty: "Easy",
    topic: "Binary Trees & BSTs",
    acceptance: "56.9%",
    companies: ["Amazon", "Meta", "Microsoft"],
    diagramType: "binary_tree",
    description: `Check whether a binary tree is a mirror image of itself around its root.`,
    examples: [{ input: "root = [1, 2, 2, 3, 4, 4, 3]", output: "true" }],
    constraints: ["1 <= nodes <= 1000"],
    defaultStdin: "1 2 2 3 4 4 3",
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def isMirror(a, b):
    if not a and not b: return True
    if not a or not b or a.val != b.val: return False
    return isMirror(a.left, b.right) and isMirror(a.right, b.left)

root = TreeNode(1, TreeNode(2, TreeNode(3), TreeNode(4)), TreeNode(2, TreeNode(4), TreeNode(3)))
print("Symmetric:", isMirror(root.left, root.right))
`,
      javascript: `class TreeNode { constructor(val=0,left=null,right=null){this.val=val;this.left=left;this.right=right;} }
function isMirror(a, b) {
  if (!a && !b) return true;
  if (!a || !b || a.val !== b.val) return false;
  return isMirror(a.left, b.right) && isMirror(a.right, b.left);
}
const root = new TreeNode(1, new TreeNode(2, new TreeNode(3), new TreeNode(4)), new TreeNode(2, new TreeNode(4), new TreeNode(3)));
console.log("Symmetric:", isMirror(root.left, root.right));
`,
      cpp: `#include <iostream>
using namespace std;
struct TreeNode{int val;TreeNode* left,*right;TreeNode(int v,TreeNode*l=nullptr,TreeNode*r=nullptr):val(v),left(l),right(r){}};
bool sym(TreeNode*a,TreeNode*b){return (!a&&!b)||(a&&b&&a->val==b->val&&sym(a->left,b->right)&&sym(a->right,b->left));}
int main(){TreeNode* r=new TreeNode(1,new TreeNode(2),new TreeNode(2));cout<<(sym(r->left,r->right)?"true":"false")<<endl;}
`,
      java: `public class Main {
    static class TreeNode{int val;TreeNode left,right;TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}
    static boolean sym(TreeNode a,TreeNode b){return (a==null&&b==null)||(a!=null&&b!=null&&a.val==b.val&&sym(a.left,b.right)&&sym(a.right,b.left));}
    public static void main(String[] args){TreeNode r=new TreeNode(1,new TreeNode(2,null,null),new TreeNode(2,null,null));System.out.println(sym(r.left,r.right));}
}
`,
    },
  },
  {
    id: "validate-binary-search-tree",
    slug: "validate-binary-search-tree",
    title: "46. Validate Binary Search Tree",
    difficulty: "Medium",
    topic: "Binary Trees & BSTs",
    acceptance: "33.1%",
    companies: ["Meta", "Amazon", "Bloomberg", "Microsoft"],
    diagramType: "binary_tree",
    description: `Determine whether a binary tree satisfies the strict BST invariant using min/max bounds.`,
    examples: [{ input: "root = [5, 3, 7, 1, 4, 6, 8]", output: "true" }],
    constraints: ["1 <= nodes <= 10^4"],
    defaultStdin: "5 3 7 1 4 6 8",
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def isValidBST(node, low=float("-inf"), high=float("inf")):
    if not node: return True
    if not (low < node.val < high): return False
    return isValidBST(node.left, low, node.val) and isValidBST(node.right, node.val, high)

root = TreeNode(5, TreeNode(3, TreeNode(1), TreeNode(4)), TreeNode(7, TreeNode(6), TreeNode(8)))
print("Valid BST:", isValidBST(root))
`,
      javascript: `class TreeNode { constructor(val=0,left=null,right=null){this.val=val;this.left=left;this.right=right;} }
function isValidBST(node, low = -Infinity, high = Infinity) {
  if (!node) return true;
  if (node.val <= low || node.val >= high) return false;
  return isValidBST(node.left, low, node.val) && isValidBST(node.right, node.val, high);
}
const root = new TreeNode(5, new TreeNode(3, new TreeNode(1), new TreeNode(4)), new TreeNode(7, new TreeNode(6), new TreeNode(8)));
console.log("Valid BST:", isValidBST(root));
`,
      cpp: `#include <iostream>
#include <climits>
using namespace std;
struct TreeNode{int val;TreeNode* left,*right;TreeNode(int v,TreeNode*l=nullptr,TreeNode*r=nullptr):val(v),left(l),right(r){}};
bool valid(TreeNode*n,long lo,long hi){return !n||(n->val>lo&&n->val<hi&&valid(n->left,lo,n->val)&&valid(n->right,n->val,hi));}
int main(){TreeNode*r=new TreeNode(5,new TreeNode(3),new TreeNode(7));cout<<(valid(r,LONG_MIN,LONG_MAX)?"true":"false")<<endl;}
`,
      java: `public class Main {
    static class TreeNode{int val;TreeNode left,right;TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}
    static boolean valid(TreeNode n,long lo,long hi){return n==null||(n.val>lo&&n.val<hi&&valid(n.left,lo,n.val)&&valid(n.right,n.val,hi));}
    public static void main(String[] args){System.out.println(valid(new TreeNode(5,new TreeNode(3,null,null),new TreeNode(7,null,null)),Long.MIN_VALUE,Long.MAX_VALUE));}
}
`,
    },
  },
  {
    id: "lca-of-bst",
    slug: "lca-of-bst",
    title: "47. Lowest Common Ancestor of a BST",
    difficulty: "Medium",
    topic: "Binary Trees & BSTs",
    acceptance: "65.1%",
    companies: ["Meta", "Amazon", "LinkedIn"],
    diagramType: "binary_tree",
    description: `Find the lowest common ancestor node of values \`p\` and \`q\` in a Binary Search Tree.`,
    examples: [{ input: "root = [6,2,8,0,4,7,9], p = 2, q = 8", output: "6" }],
    constraints: ["2 <= nodes <= 10^5"],
    defaultStdin: "6 2 8 0 4 7 9\n2 8",
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def lowestCommonAncestor(root, p, q):
    curr = root
    while curr:
        if p < curr.val and q < curr.val: curr = curr.left
        elif p > curr.val and q > curr.val: curr = curr.right
        else: return curr.val
    return None

root = TreeNode(6, TreeNode(2, TreeNode(0), TreeNode(4)), TreeNode(8, TreeNode(7), TreeNode(9)))
print("LCA(2, 4):", lowestCommonAncestor(root, 2, 4))
`,
      javascript: `class TreeNode { constructor(val=0,left=null,right=null){this.val=val;this.left=left;this.right=right;} }
function lowestCommonAncestor(root, p, q) {
  let curr = root;
  while (curr) {
    if (p < curr.val && q < curr.val) curr = curr.left;
    else if (p > curr.val && q > curr.val) curr = curr.right;
    else return curr.val;
  }
  return null;
}
const root = new TreeNode(6, new TreeNode(2, new TreeNode(0), new TreeNode(4)), new TreeNode(8, new TreeNode(7), new TreeNode(9)));
console.log("LCA(2, 4):", lowestCommonAncestor(root, 2, 4));
`,
      cpp: `#include <iostream>
using namespace std;
struct TreeNode{int val;TreeNode* left,*right;TreeNode(int v,TreeNode*l=nullptr,TreeNode*r=nullptr):val(v),left(l),right(r){}};
int main(){TreeNode*r=new TreeNode(6,new TreeNode(2),new TreeNode(8)),*c=r;int p=2,q=8;while(c){if(p<c->val&&q<c->val)c=c->left;else if(p>c->val&&q>c->val)c=c->right;else break;}cout<<c->val<<endl;}
`,
      java: `public class Main {
    static class TreeNode{int val;TreeNode left,right;TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}
    public static void main(String[] args){TreeNode c=new TreeNode(6,new TreeNode(2,null,null),new TreeNode(8,null,null));int p=2,q=8;while(c!=null){if(p<c.val&&q<c.val)c=c.left;else if(p>c.val&&q>c.val)c=c.right;else break;}System.out.println(c.val);}
}
`,
    },
  },
  {
    id: "diameter-of-binary-tree",
    slug: "diameter-of-binary-tree",
    title: "48. Diameter of Binary Tree",
    difficulty: "Easy",
    topic: "Binary Trees & BSTs",
    acceptance: "60.4%",
    companies: ["Meta", "Amazon", "Google", "Microsoft"],
    diagramType: "binary_tree",
    description: `Return the length of the longest path (edge count) between any two nodes in a binary tree.`,
    examples: [{ input: "root = [1, 2, 3, 4, 5]", output: "3" }],
    constraints: ["1 <= nodes <= 10^4"],
    defaultStdin: "1 2 3 4 5",
    templates: {
      python: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def diameterOfBinaryTree(root):
    best = 0
    def height(node):
        nonlocal best
        if not node: return 0
        lh, rh = height(node.left), height(node.right)
        best = max(best, lh + rh)
        return 1 + max(lh, rh)
    height(root)
    return best

root = TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), TreeNode(3))
print("Diameter:", diameterOfBinaryTree(root))
`,
      javascript: `class TreeNode { constructor(val=0,left=null,right=null){this.val=val;this.left=left;this.right=right;} }
function diameterOfBinaryTree(root) {
  let best = 0;
  function height(node) {
    if (!node) return 0;
    const lh = height(node.left), rh = height(node.right);
    best = Math.max(best, lh + rh);
    return 1 + Math.max(lh, rh);
  }
  height(root);
  return best;
}
const root = new TreeNode(1, new TreeNode(2, new TreeNode(4), new TreeNode(5)), new TreeNode(3));
console.log("Diameter:", diameterOfBinaryTree(root));
`,
      cpp: `#include <iostream>
using namespace std;
struct TreeNode{int val;TreeNode*left,*right;TreeNode(int v,TreeNode*l=nullptr,TreeNode*r=nullptr):val(v),left(l),right(r){}};
int best=0;int h(TreeNode*n){if(!n)return 0;int l=h(n->left),r=h(n->right);best=max(best,l+r);return 1+max(l,r);}
int main(){h(new TreeNode(1,new TreeNode(2,new TreeNode(4),new TreeNode(5)),new TreeNode(3)));cout<<best<<endl;}
`,
      java: `public class Main {
    static class TreeNode{int val;TreeNode left,right;TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;}}
    static int best=0;static int h(TreeNode n){if(n==null)return 0;int l=h(n.left),r=h(n.right);best=Math.max(best,l+r);return 1+Math.max(l,r);}
    public static void main(String[] args){h(new TreeNode(1,new TreeNode(2,new TreeNode(4,null,null),new TreeNode(5,null,null)),new TreeNode(3,null,null)));System.out.println(best);}
}
`,
    },
  },
  {
    id: "climbing-stairs",
    slug: "climbing-stairs",
    title: "49. Climbing Stairs (1D DP)",
    difficulty: "Easy",
    topic: "Dynamic Programming",
    acceptance: "52.9%",
    companies: ["Amazon", "Google", "TCS", "Adobe"],
    diagramType: "array_pointers",
    description: `Count distinct ways to climb \`n\` stairs taking either 1 or 2 steps at a time. Watch the \`dp\` array fill cell-by-cell in the diagram!`,
    examples: [{ input: "n = 6", output: "13" }],
    constraints: ["1 <= n <= 45"],
    defaultStdin: "6",
    templates: {
      python: `def climbStairs(n):
    dp = [0] * (n + 1)
    dp[0] = dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]

print("Ways for n=6:", climbStairs(6))
`,
      javascript: `function climbStairs(n) {
  const dp = Array(n + 1).fill(0);
  dp[0] = dp[1] = 1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp[n];
}
console.log("Ways for n=6:", climbStairs(6));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main(){int n=6;vector<int>dp(n+1,1);for(int i=2;i<=n;i++)dp[i]=dp[i-1]+dp[i-2];cout<<dp[n]<<endl;}
`,
      java: `public class Main {
    public static void main(String[] args){int n=6;int[]dp=new int[n+1];dp[0]=dp[1]=1;for(int i=2;i<=n;i++)dp[i]=dp[i-1]+dp[i-2];System.out.println(dp[n]);}
}
`,
    },
  },
  {
    id: "house-robber",
    slug: "house-robber",
    title: "50. House Robber",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    acceptance: "51.1%",
    companies: ["Amazon", "Google", "Airbnb", "Goldman Sachs"],
    diagramType: "array_pointers",
    description: `Given amounts in houses along a street, compute maximum loot without robbing two adjacent houses.`,
    examples: [{ input: "nums = [2, 7, 9, 3, 1]", output: "12" }],
    constraints: ["1 <= nums.length <= 100"],
    defaultStdin: "2 7 9 3 1",
    templates: {
      python: `def rob(nums):
    dp = [0] * (len(nums) + 1)
    dp[1] = nums[0]
    for i in range(2, len(nums) + 1):
        dp[i] = max(dp[i - 1], dp[i - 2] + nums[i - 1])
    return dp[-1]

nums = [2, 7, 9, 3, 1]
print("Max loot:", rob(nums))
`,
      javascript: `function rob(nums) {
  const dp = Array(nums.length + 1).fill(0);
  dp[1] = nums[0];
  for (let i = 2; i <= nums.length; i++) dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i - 1]);
  return dp[nums.length];
}
const nums = [2, 7, 9, 3, 1];
console.log("Max loot:", rob(nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main(){vector<int>a={2,7,9,3,1};int p2=0,p1=0;for(int x:a){int c=max(p1,p2+x);p2=p1;p1=c;}cout<<p1<<endl;}
`,
      java: `public class Main {
    public static void main(String[] args){int[]a={2,7,9,3,1};int p2=0,p1=0;for(int x:a){int c=Math.max(p1,p2+x);p2=p1;p1=c;}System.out.println(p1);}
}
`,
    },
  },
  {
    id: "coin-change",
    slug: "coin-change",
    title: "51. Coin Change (Minimum Coins)",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    acceptance: "44.2%",
    companies: ["Amazon", "Google", "Uber", "Microsoft"],
    diagramType: "array_pointers",
    description: `Compute the fewest number of coins needed to make up \`amount\`, or \`-1\` if impossible.`,
    examples: [{ input: "coins = [1, 2, 5], amount = 11", output: "3", explanation: "5 + 5 + 1 = 11" }],
    constraints: ["1 <= coins.length <= 12, 0 <= amount <= 10^4"],
    defaultStdin: "1 2 5\n11",
    templates: {
      python: `def coinChange(coins, amount):
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i:
                dp[i] = min(dp[i], dp[i - c] + 1)
    return -1 if dp[amount] > amount else dp[amount]

coins = [1, 2, 5]
print("Min coins:", coinChange(coins, 11))
`,
      javascript: `function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(amount + 1);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const c of coins) if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
  }
  return dp[amount] > amount ? -1 : dp[amount];
}
console.log("Min coins:", coinChange([1, 2, 5], 11));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main(){vector<int>c={1,2,5},dp(12,99);dp[0]=0;for(int i=1;i<=11;i++)for(int x:c)if(x<=i)dp[i]=min(dp[i],dp[i-x]+1);cout<<dp[11]<<endl;}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args){int[]c={1,2,5},dp=new int[12];Arrays.fill(dp,99);dp[0]=0;for(int i=1;i<=11;i++)for(int x:c)if(x<=i)dp[i]=Math.min(dp[i],dp[i-x]+1);System.out.println(dp[11]);}
}
`,
    },
  },
  {
    id: "longest-increasing-subsequence",
    slug: "longest-increasing-subsequence",
    title: "52. Longest Increasing Subsequence",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    acceptance: "55.3%",
    companies: ["Google", "Amazon", "Meta", "Microsoft"],
    diagramType: "array_pointers",
    description: `Find the length of the longest strictly increasing subsequence in an array.`,
    examples: [{ input: "nums = [10, 9, 2, 5, 3, 7, 101, 18]", output: "4" }],
    constraints: ["1 <= nums.length <= 2500"],
    defaultStdin: "10 9 2 5 3 7 101 18",
    templates: {
      python: `def lengthOfLIS(nums):
    dp = [1] * len(nums)
    for i in range(1, len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)

nums = [10, 9, 2, 5, 3, 7, 101, 18]
print("LIS length:", lengthOfLIS(nums))
`,
      javascript: `function lengthOfLIS(nums) {
  const dp = Array(nums.length).fill(1);
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
  }
  return Math.max(...dp);
}
console.log("LIS length:", lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]));
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){vector<int>a={10,9,2,5,3,7,101,18},dp(a.size(),1);for(int i=1;i<(int)a.size();i++)for(int j=0;j<i;j++)if(a[j]<a[i])dp[i]=max(dp[i],dp[j]+1);cout<<*max_element(dp.begin(),dp.end())<<endl;}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args){int[]a={10,9,2,5,3,7,101,18},dp=new int[a.length];Arrays.fill(dp,1);int b=1;for(int i=1;i<a.length;i++)for(int j=0;j<i;j++)if(a[j]<a[i]){dp[i]=Math.max(dp[i],dp[j]+1);b=Math.max(b,dp[i]);}System.out.println(b);}
}
`,
    },
  },
  {
    id: "subsets-backtracking",
    slug: "subsets-backtracking",
    title: "53. Subsets (Power Set Backtracking)",
    difficulty: "Medium",
    topic: "Backtracking & Graphs",
    acceptance: "78.1%",
    companies: ["Meta", "Amazon", "Google", "Bloomberg"],
    diagramType: "stack",
    description: `Return all unique subsets of \`nums\` using backtracking recursion over \`stack\`.`,
    examples: [{ input: "nums = [1, 2, 3]", output: "[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]" }],
    constraints: ["1 <= nums.length <= 10"],
    defaultStdin: "1 2 3",
    templates: {
      python: `def subsets(nums):
    res = []
    stack = []
    def bt(idx):
        res.append(list(stack))
        for i in range(idx, len(nums)):
            stack.append(nums[i])
            bt(i + 1)
            stack.pop()
    bt(0)
    return res

print("Subsets:", subsets([1, 2, 3]))
`,
      javascript: `function subsets(nums) {
  const res = [], stack = [];
  function bt(idx) {
    res.push([...stack]);
    for (let i = idx; i < nums.length; i++) {
      stack.push(nums[i]);
      bt(i + 1);
      stack.pop();
    }
  }
  bt(0);
  return res;
}
console.log("Subsets:", JSON.stringify(subsets([1, 2, 3])));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
void bt(vector<int>&a,int i,vector<int>&cur){for(int x:cur)cout<<x;cout<<"|";for(int j=i;j<(int)a.size();j++){cur.push_back(a[j]);bt(a,j+1,cur);cur.pop_back();}}
int main(){vector<int>a={1,2,3},c;bt(a,0,c);}
`,
      java: `import java.util.*;
public class Main {
    static void bt(int[]a,int i,List<Integer>c){System.out.println(c);for(int j=i;j<a.length;j++){c.add(a[j]);bt(a,j+1,c);c.remove(c.size()-1);}}
    public static void main(String[] args){bt(new int[]{1,2,3},0,new ArrayList<>());}
}
`,
    },
  },
  {
    id: "course-schedule-toposort",
    slug: "course-schedule-toposort",
    title: "54. Course Schedule (Topological BFS)",
    difficulty: "Medium",
    topic: "Backtracking & Graphs",
    acceptance: "47.0%",
    companies: ["Amazon", "Google", "Meta", "Uber"],
    diagramType: "array_pointers",
    description: `Check whether all \`numCourses\` courses can be finished without cyclic prerequisites using Kahn's algorithm on \`indegree\`.`,
    examples: [{ input: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", output: "true" }],
    constraints: ["1 <= numCourses <= 2000"],
    defaultStdin: "4\n1 0\n2 0\n3 1\n3 2",
    templates: {
      python: `from collections import deque

def canFinish(n, prereqs):
    adj = [[] for _ in range(n)]
    indegree = [0] * n
    for course, pre in prereqs:
        adj[pre].append(course)
        indegree[course] += 1
    queue = deque(i for i in range(n) if indegree[i] == 0)
    visited = 0
    while queue:
        u = queue.popleft()
        visited += 1
        for v in adj[u]:
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    return visited == n

print("Can finish all:", canFinish(4, [[1, 0], [2, 0], [3, 1], [3, 2]]))
`,
      javascript: `function canFinish(n, prereqs) {
  const adj = Array.from({ length: n }, () => []);
  const indegree = Array(n).fill(0);
  for (const [c, p] of prereqs) { adj[p].push(c); indegree[c]++; }
  const q = [];
  for (let i = 0; i < n; i++) if (indegree[i] === 0) q.push(i);
  let visited = 0;
  while (q.length) {
    const u = q.shift(); visited++;
    for (const v of adj[u]) if (--indegree[v] === 0) q.push(v);
  }
  return visited === n;
}
console.log("Can finish all:", canFinish(4, [[1, 0], [2, 0], [3, 1], [3, 2]]));
`,
      cpp: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main(){
    int n=4; vector<vector<int>> adj(n); vector<int> in(n,0);
    for(auto p:vector<pair<int,int>>{{1,0},{2,0},{3,1},{3,2}}){adj[p.second].push_back(p.first);in[p.first]++;}
    queue<int> q; for(int i=0;i<n;i++)if(!in[i])q.push(i);
    int vis=0; while(!q.empty()){int u=q.front();q.pop();vis++;for(int v:adj[u])if(--in[v]==0)q.push(v);}
    cout<<(vis==n?"true":"false")<<endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args){
        int n=4; int[][] pre={{1,0},{2,0},{3,1},{3,2}}; int[]in=new int[n];
        List<Integer>[] adj=new List[n]; for(int i=0;i<n;i++)adj[i]=new ArrayList<>();
        for(int[]p:pre){adj[p[1]].add(p[0]);in[p[0]]++;}
        Queue<Integer>q=new LinkedList<>();for(int i=0;i<n;i++)if(in[i]==0)q.add(i);
        int vis=0;while(!q.isEmpty()){int u=q.poll();vis++;for(int v:adj[u])if(--in[v]==0)q.add(v);}
        System.out.println(vis==n);
    }
}
`,
    },
  },
  {
    id: "custom-playground",
    slug: "custom-playground",
    title: "55. Custom Code & Diagram Playground",
    difficulty: "Medium",
    topic: "Free Coding & Live Diagrams",
    acceptance: "100%",
    companies: ["Practice"],
    diagramType: "array_pointers",
    description: `Write any code here. The live diagram panel automatically detects arrays + pointers, Linked Lists, Binary Trees, and Stacks in real time!`,
    examples: [],
    constraints: ["Python 3.12 & JavaScript live execution"],
    defaultStdin: "",
    templates: {
      python: `def bubbleSort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]

numbers = [64, 34, 25, 12, 22, 11]
bubbleSort(numbers)
print("Sorted:", numbers)
`,
      javascript: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}
const numbers = [64, 34, 25, 12, 22, 11];
bubbleSort(numbers);
console.log("Sorted:", numbers);
`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "Ready to code." << endl; }
`,
      java: `public class Main {
    public static void main(String[] args) { System.out.println("Ready to code."); }
}
`,
    },
  },
];
